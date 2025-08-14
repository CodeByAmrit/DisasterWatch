// utils/categoryMapper.js
function mapCategory(rawCategory) {
  if (!rawCategory) return 'other';
  const normalized = rawCategory.toLowerCase();

  if (normalized.includes('earthquake')) return 'earthquake';
  if (normalized.includes('flood')) return 'flood';
  if (normalized.includes('cyclone') || normalized.includes('hurricane') || normalized.includes('typhoon')) return 'cyclone';
  if (normalized.includes('fire')) return 'wildfire';
  if (normalized.includes('volcano')) return 'volcano';
  if (normalized.includes('storm')) return 'storm';
  if (normalized.includes('landslide')) return 'landslide';
  if (normalized.includes('drought')) return 'drought';
  if (normalized.includes('tsunami')) return 'tsunami';

  return 'other';
}

module.exports = { mapCategory };
