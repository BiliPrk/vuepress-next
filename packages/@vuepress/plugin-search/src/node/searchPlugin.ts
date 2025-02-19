import type { Page, Plugin } from '@vuepress/core'
import type { LocaleConfig } from '@vuepress/shared'
import { path } from '@vuepress/utils'
import * as chokidar from 'chokidar'
import { prepareSearchIndex } from './prepareSearchIndex'

export interface SearchPluginOptions {
  locales?: LocaleConfig<{
    placeholder: string
  }>
  hotKeys?: string[]
  maxSuggestions?: number
  isSearchable?: (page: Page) => boolean
  getExtraFields?: (page: Page) => string[]
}

export const searchPlugin = ({
  locales = {},
  hotKeys = ['s', '/'],
  maxSuggestions = 5,
  isSearchable = () => true,
  getExtraFields = () => [],
}: SearchPluginOptions = {}): Plugin => ({
  name: '@vuepress/plugin-search',

  clientConfigFile: path.resolve(__dirname, '../client/config.js'),

  define: {
    __SEARCH_LOCALES__: locales,
    __SEARCH_HOT_KEYS__: hotKeys,
    __SEARCH_MAX_SUGGESTIONS__: maxSuggestions,
  },

  onPrepared: async (app) => {
    await prepareSearchIndex({ app, isSearchable, getExtraFields })
  },

  onWatched: (app, watchers) => {
    // here we only watch the page data files
    // if the extra fields generated by `getExtraFields` are not included
    // in the page data, the changes may not be watched
    const searchIndexWatcher = chokidar.watch('internal/pageData/*', {
      cwd: app.dir.temp(),
      ignoreInitial: true,
    })
    searchIndexWatcher.on('add', () => {
      prepareSearchIndex({ app, isSearchable, getExtraFields })
    })
    searchIndexWatcher.on('change', () => {
      prepareSearchIndex({ app, isSearchable, getExtraFields })
    })
    searchIndexWatcher.on('unlink', () => {
      prepareSearchIndex({ app, isSearchable, getExtraFields })
    })
    watchers.push(searchIndexWatcher)
  },
})
