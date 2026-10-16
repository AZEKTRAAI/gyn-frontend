// shortcut: swaps to a DatabaseAdapter when DATABASE_URL is set; upgrade when Azam adds the DB
import { StaticAdapter } from './static-adapter'

export const cms = new StaticAdapter()
export type { CmsAdapter } from './types'
