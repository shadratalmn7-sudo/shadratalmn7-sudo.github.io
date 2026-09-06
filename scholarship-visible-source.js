import { mergeScholarships } from './scholarship-catalog.js?v=20260907-visible-source';
import { referenceOpportunities } from './opportunity-index.js?v=20260907-visible-source';

export function buildVisibleScholarships(remoteItems = []) {
  const publishedRemote = (Array.isArray(remoteItems) ? remoteItems : []).filter(item => item?.publishStatus === 'published');
  return mergeScholarships([...referenceOpportunities, ...publishedRemote])
    .filter(item => item?.publishStatus === 'published');
}
