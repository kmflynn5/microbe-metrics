# JGI API Limitations & Investigation

**Date**: October 6, 2025
**Status**: API pagination not working as expected
**Impact**: Limited to ~20-30 unique genomes per extraction instead of 9,500+

## Current API Usage

### Endpoint

```
https://files.jgi.doe.gov/search/
```

### Parameters Used

```
q=archaea+genome  OR  q=bacteria+genome
superseded=Current
dataset_type=Finished+Genome
start={offset}      # Pagination offset (0, 100, 200, etc.)
rows={pageSize}     # Requested page size (we use 100)
```

### Example Request

```bash
curl -H "User-Agent: MicrobeMetrics/1.0 (genomes.kenflynn.dev)" \
     -H "Accept: application/json" \
     "https://files.jgi.doe.gov/search/?q=archaea+genome&superseded=Current&dataset_type=Finished+Genome&start=0&rows=100"
```

## Observed Behavior

### Issue #1: `rows` Parameter Ignored

**Expected**: Requesting `rows=100` should return 100 organisms per page
**Actual**: API always returns exactly 10 organisms, regardless of `rows` value

**Evidence from logs**:

```
Requested: rows=100
Received: organismCount: 10
```

### Issue #2: `start` Parameter Not Advancing Results

**Expected**: Incrementing `start` (0, 100, 200) should return different organisms
**Actual**: Same 10 organisms returned on every page

**Evidence from test run** (100 pages × 2 domains):

- Extracted 980 total organisms (98 pages × 10 organisms)
- After deduplication: Only 20 unique organisms
- Same genome IDs repeated dozens of times (e.g., `IMG_AP-1110612` appeared 49 times)

**Log evidence**:

```
Page 1: start=0,   organismCount=10, totalAvailable=4171
Page 2: start=100, organismCount=10, totalAvailable=4171  # Same 10 organisms!
Page 3: start=200, organismCount=10, totalAvailable=4171  # Same 10 organisms!
```

### Response Metadata

The API does report accurate totals:

- `totalAvailable: 4171` for Archaea
- `totalAvailable: 5346` for Bacteria
- **Total: 9,517 genomes available** (but we can only access ~20)

## Test Commands for Investigation

### 1. Test Different Page Sizes

```bash
# Test if smaller rows values work better
curl -s "https://files.jgi.doe.gov/search/?q=archaea+genome&superseded=Current&dataset_type=Finished+Genome&start=0&rows=10" | jq '.total, .organisms | length'
curl -s "https://files.jgi.doe.gov/search/?q=archaea+genome&superseded=Current&dataset_type=Finished+Genome&start=0&rows=25" | jq '.total, .organisms | length'
curl -s "https://files.jgi.doe.gov/search/?q=archaea+genome&superseded=Current&dataset_type=Finished+Genome&start=0&rows=50" | jq '.total, .organisms | length'
curl -s "https://files.jgi.doe.gov/search/?q=archaea+genome&superseded=Current&dataset_type=Finished+Genome&start=0&rows=100" | jq '.total, .organisms | length'
```

### 2. Test Pagination Advancement

```bash
# Get first 10 organism IDs
curl -s "https://files.jgi.doe.gov/search/?q=archaea+genome&superseded=Current&dataset_type=Finished+Genome&start=0&rows=100" | jq '.organisms[0:10] | map(.organism_id)'

# Get next 10 organism IDs (should be different)
curl -s "https://files.jgi.doe.gov/search/?q=archaea+genome&superseded=Current&dataset_type=Finished+Genome&start=10&rows=100" | jq '.organisms[0:10] | map(.organism_id)'

# Try larger offset
curl -s "https://files.jgi.doe.gov/search/?q=archaea+genome&superseded=Current&dataset_type=Finished+Genome&start=100&rows=100" | jq '.organisms[0:10] | map(.organism_id)'
```

### 3. Test Different Query Formats

```bash
# Try without dataset_type filter
curl -s "https://files.jgi.doe.gov/search/?q=archaea+genome&superseded=Current&start=0&rows=100" | jq '.total, .organisms | length'

# Try with specific phylum
curl -s "https://files.jgi.doe.gov/search/?q=Thaumarchaeota&superseded=Current&dataset_type=Finished+Genome&start=0&rows=100" | jq '.total, .organisms | length'

# Try different search terms
curl -s "https://files.jgi.doe.gov/search/?q=archaea&superseded=Current&start=0&rows=100" | jq '.total, .organisms | length'
```

### 4. Test Alternative API Endpoints

```bash
# Check if there's a different endpoint for bulk access
curl -s "https://files.jgi.doe.gov/api/organisms/?domain=Archaea&limit=100" | jq

# Try the IMG (Integrated Microbial Genomes) API
curl -s "https://img.jgi.doe.gov/cgi-bin/m/main.cgi?section=TaxonList&page=taxonListAlpha&domain=Archaea" | head -100
```

### 5. Test Response Format Variations

```bash
# Try requesting JSON explicitly
curl -s -H "Accept: application/json" "https://files.jgi.doe.gov/search/?q=archaea+genome&superseded=Current&dataset_type=Finished+Genome&start=0&rows=100" | jq '.organisms | length'

# Try XML format (might have different pagination)
curl -s -H "Accept: application/xml" "https://files.jgi.doe.gov/search/?q=archaea+genome&superseded=Current&dataset_type=Finished+Genome&start=0&rows=100" | head -50
```

### 6. Check API Documentation

```bash
# Look for API docs or WADL/OpenAPI spec
curl -s "https://files.jgi.doe.gov/api/" | head -100
curl -s "https://files.jgi.doe.gov/search/help" | head -100
curl -s "https://files.jgi.doe.gov/swagger.json" | jq
```

## Current Workaround

Our incremental extraction system is **fully functional** despite the API limitation:

1. **Daily incremental runs**: Extract ~20-30 genomes per run
2. **Master dataset**: Maintains cumulative collection with deduplication
3. **Analytics**: Tracks new vs updated genomes
4. **Audit trail**: Daily extractions stored in R2

**Effective strategy**:

- Run extractions more frequently (multiple times per day)
- Try different search queries to get different organisms
- Gradually build up the master dataset over time

## Potential Solutions to Investigate

### 1. Alternative Search Queries

Try searching by specific taxonomic groups instead of broad "archaea genome":

```bash
# By phylum
q=Thaumarchaeota+genome
q=Euryarchaeota+genome
q=Crenarchaeota+genome

# By specific genera
q=Methanococcus+genome
q=Sulfolobus+genome
```

### 2. JGI Portal API (if exists)

The organisms have portal URLs like `https://genome.jgi.doe.gov/portal/{organism_id}`. There might be a proper REST API for the portal:

```bash
curl -s "https://genome.jgi.doe.gov/api/portal/organisms?domain=Archaea&limit=100"
```

### 3. Contact JGI Support

- Email: jgi-help@lbl.gov
- Ask about:
  - Bulk download API for all genomes
  - Correct pagination parameters
  - Rate limits and best practices
  - Alternative endpoints for programmatic access

### 4. Direct Database Access

JGI might provide:

- FTP server with genome lists
- Database dumps
- Bulk download tools (like `lftp` or custom scripts)

## Implementation Status

✅ **Completed**:

- Incremental extraction system with merge/dedup logic
- Master dataset management in R2
- New vs updated genome tracking
- Analytics generation from master dataset
- Full local testing infrastructure

⏸️ **Blocked by API**:

- Accessing all 9,517 available genomes
- Efficient bulk extraction
- True pagination support

## Next Steps

1. **Test the curl commands above** to understand API behavior
2. **Try alternative search queries** (phylum-specific, etc.)
3. **Contact JGI support** for guidance on bulk access
4. **Document findings** and update extraction strategy
5. **Consider alternative data sources** (NCBI, ENA, etc.) if JGI doesn't support bulk access

## Files Modified in This Session

### Incremental Extraction Implementation

- `src/worker/jgi-extractor.ts` - Added full/incremental modes, merge/dedup logic
- `src/worker/storage-manager.ts` - Added master dataset methods
- `src/worker/api.ts` - Updated scheduled handler for incremental extraction
- `src/worker/debug.ts` - Added triggerExtraction with full flag support

### Test Results

- Local R2: `master/genomes.json` - 20 unique genomes
- Local R2: `raw/jgi-responses/2025-10-06.json` - 980 organisms (mostly duplicates)
- Local KV: `master_metadata` - Stats: 20 total, 0 new, 0 updated

## API Response Structure

For reference, here's the actual structure we're working with:

```json
{
	"total": 4171,
	"organisms": [
		{
			"organism_id": "IMG_AP-1110612",
			"organism_name": "Thaumarchaeota archaea JGI 01_K11",
			"phylum": "Thaumarchaeota",
			"class_name": null,
			"order_name": null,
			"family": null,
			"genus": null,
			"species": null,
			"strain": null,
			"added_date": "2020-01-15",
			"release_date": "2020-03-01",
			"est_size": 1234567,
			"gene_count": null,
			"portal_url": "https://genome.jgi.doe.gov/portal/Tha01K11",
			"download_url": null
		}
		// ... 9 more (always exactly 10)
	]
}
```

**Note**: The `organism_id` field contains the unique identifier we use for deduplication.
