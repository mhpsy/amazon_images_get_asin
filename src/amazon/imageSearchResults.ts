import z from 'zod'

export const ColorSwatchSchema = z.object({
  asin: z.string(),
  hexColor: z.string(),
})

export const TwisterVariationSchema = z.object({
  asin: z.string(),
  imageUrl: z.string(),
})

export const BbxAsinMetadataListSchema = z.object({
  glProductGroup: z.string(),
  byLine: z.string(),
  price: z.string().nullish(),
  listPrice: z.string().nullish(),
  currencyPriceRange: z.any(),
  variationalSomePrimeEligible: z.any(),
  imageUrl: z.string(),
  asin: z.string(),
  availability: z.string().nullish(),
  title: z.string(),
  isAdultProduct: z.string(),
  isEligibleForPrimeShipping: z.any(),
  averageOverallRating: z.number().nullish(),
  totalReviewCount: z.string().nullish(),
  colorSwatches: z.array(ColorSwatchSchema),
  twisterVariations: z.array(TwisterVariationSchema),
})

export const BoundingBoxSchema = z.object({
  imageWidth: z.number(),
  tly: z.number(),
  tlx: z.number(),
  topLeftY: z.number(),
  bottomRightX: z.number(),
  topLeftX: z.number(),
  imh: z.number(),
  bottomLeftY: z.number(),
  bottomLeftX: z.number(),
  bry: z.number(),
  brx: z.number(),
  bottomRightY: z.number(),
  personScore: z.string(),
  imageHeight: z.number(),
  bly: z.number(),
  blx: z.number(),
  imw: z.number(),
  topRightX: z.number(),
  isBeliefPropagationEthnic: z.boolean(),
  topRightY: z.number(),
  personID: z.number(),
  try: z.number(),
  trx: z.number(),
  personType: z.string(),
})

export const Properties2Schema = z.object({
  score: z.string(),
  glcode: z.string(),
})

export const SubContentSchema = z.object({
  source: z.string(),
  contentType: z.string(),
  content: z.string(),
  dataSource: z.string(),
  properties: Properties2Schema,
  refMarker: z.string(),
  subContent: z.array(z.any()),
  metricAlias: z.string(),
})

export const PropertiesSchema = z.object({
  score: z.string(),
  boundingBox: BoundingBoxSchema,
  modelName: z.string(),
  finerClassification: z.array(z.any()),
  label: z.string(),
  category: z.string(),
  hasInfluencerTaggedASINs: z.boolean(),
  featureIndices: z.string(),
})

export const SearchResultSchema = z.object({
  source: z.string(),
  contentType: z.string(),
  content: z.string(),
  dataSource: z.string(),
  properties: PropertiesSchema,
  subContent: z.array(SubContentSchema),
  bbxAsinMetadataList: z.array(BbxAsinMetadataListSchema),
  displayLaunchPoint: z.string(),
  displayFeatureName: z.string(),
  bbxAsinList: z.array(z.string()),
  bbxRefMarker: z.string(),
})

export const ImageSearchResultsSchema = z.object({
  queryId: z.string(),
  searchResults: z.array(SearchResultSchema),
})

export interface ImageSearchResults {
  queryId: string
  searchResults: SearchResult[]
}

export interface SearchResult {
  source: string
  contentType: string
  content: string
  dataSource: string
  properties: Properties
  subContent: SubContent[]
  bbxAsinMetadataList: BbxAsinMetadataList[]
  displayLaunchPoint: string
  displayFeatureName: string
  bbxAsinList: string[]
  bbxRefMarker: string
}

export interface Properties {
  score: string
  boundingBox: BoundingBox
  modelName: string
  finerClassification: any[]
  label: string
  category: string
  hasInfluencerTaggedASINs: boolean
  featureIndices: string
}

export interface BoundingBox {
  imageWidth: number
  tly: number
  tlx: number
  topLeftY: number
  bottomRightX: number
  topLeftX: number
  imh: number
  bottomLeftY: number
  bottomLeftX: number
  bry: number
  brx: number
  bottomRightY: number
  personScore: string
  imageHeight: number
  bly: number
  blx: number
  imw: number
  topRightX: number
  isBeliefPropagationEthnic: boolean
  topRightY: number
  personID: number
  try: number
  trx: number
  personType: string
}

export interface SubContent {
  source: string
  contentType: string
  content: string
  dataSource: string
  properties: Properties2
  refMarker: string
  subContent: any[]
  metricAlias: string
}

export interface Properties2 {
  score: string
  glcode: string
}

export interface BbxAsinMetadataList {
  glProductGroup: string
  byLine: string
  price?: string | null
  listPrice?: string | null
  currencyPriceRange: any
  variationalSomePrimeEligible: any
  imageUrl: string
  asin: string
  availability?: string | null
  title: string
  isAdultProduct: string
  isEligibleForPrimeShipping: any
  averageOverallRating?: number | null
  totalReviewCount?: string | null
  colorSwatches: ColorSwatch[]
  twisterVariations: TwisterVariation[]
}

export interface ColorSwatch {
  asin: string
  hexColor: string
}

export interface TwisterVariation {
  asin: string
  imageUrl: string
}
