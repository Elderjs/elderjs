import path from 'path';
import prepareFindSvelteComponent, { removeHash } from '../prepareFindSvelteComponent';
import normalizeSnapshot from '../../utils/normalizeSnapshot';
import windowsPathFix from '../../utils/windowsPathFix';

const hashedClientComponents = [
  '/_elderjs/svelte/asyncToGenerator-7ac7dd51.js',
  '/_elderjs/svelte/clickOutside-2fd623e0.js',
  '/_elderjs/svelte/components/AutoComplete/AutoComplete.c3c8f64b.js',
  '/_elderjs/svelte/components/Breadcrumbs/Breadcrumbs.4a1a1dbc.js',
  '/_elderjs/svelte/components/Citation/Citation.34f7a30f.js',
  '/_elderjs/svelte/components/CityResults/CityResults.53644339.js',
  '/_elderjs/svelte/components/CityResults/components/FilterIcon/FilterIcon.287858fc.js',
  '/_elderjs/svelte/components/CityResults/components/ProviderResult/ProviderResult.794e2c27.js',
  '/_elderjs/svelte/components/ContactForm/ContactForm.431e5ea9.js',
  '/_elderjs/svelte/components/ContentFeedback/ContentFeedback.9e8eff3c.js',
  '/_elderjs/svelte/components/Debug/Debug.5566649a.js',
  '/_elderjs/svelte/components/DevHeader/DevHeader.2d1a5fa9.js',
  '/_elderjs/svelte/components/ElderDocsToc/ElderDocsToc.9b0b5d30.js',
  '/_elderjs/svelte/components/ExpertInfo/ExpertInfo.7fc76385.js',
  '/_elderjs/svelte/components/Footer/Footer.9bd22178.js',
  '/_elderjs/svelte/components/Header/Header.c4e04e55.js',
  '/_elderjs/svelte/components/HeaderAutoComplete/HeaderAutoComplete.35f2365f.js',
  '/_elderjs/svelte/components/HeatmapCalendar/HeatmapCalendar.3618695f.js',
  '/_elderjs/svelte/components/HomeAutoComplete/HomeAutoComplete.5b2c2c78.js',
  '/_elderjs/svelte/components/Icon/Icon.710fb2a2.js',
  '/_elderjs/svelte/components/Map/Map.88f594df.js',
  '/_elderjs/svelte/components/Modal/Modal.64c69955.js',
  '/_elderjs/svelte/components/NewLineGraph/NewLineGraph.42307a84.js',
  '/_elderjs/svelte/components/NursingHomeQuality/NursingHomeQuality.8933b643.js',
  '/_elderjs/svelte/components/NursingHomeStats/NursingHomeStats.c3d47bee.js',
  '/_elderjs/svelte/components/Picture/Picture.b76a12cd.js',
  '/_elderjs/svelte/components/ProviderMetrics/ProviderMetrics.c81798fd.js',
  '/_elderjs/svelte/components/Reporter/Reporter.3587cf62.js',
  '/_elderjs/svelte/components/SidebarArticles/SidebarArticles.81d6b578.js',
  '/_elderjs/svelte/components/SortableTable/SortableTable.708ad9c0.js',
  '/_elderjs/svelte/components/SparkBar/SparkBar.811ec65a.js',
  '/_elderjs/svelte/components/SparkLine/SparkLine.36332a3d.js',
  '/_elderjs/svelte/components/TableOfContents/TableOfContents.1c5f9df2.js',
  '/_elderjs/svelte/components/TableOfContents/TableOfContentsInner.dbc8fbbc.js',
  '/_elderjs/svelte/components/Tooltip/Tooltip.ee7f3e1f.js',
  '/_elderjs/svelte/components/ZoomableMap/components/StatePath/StatePath.c4699346.js',
  '/_elderjs/svelte/components/ZoomableMap/ZoomableMap.55372892.js',
  '/_elderjs/svelte/defineProperty-9f9de5d0.js',
  '/_elderjs/svelte/getBoundingBoxCenter-f2c146d1.js',
  '/_elderjs/svelte/getGrade9-6d7b61d1.js',
  '/_elderjs/svelte/getGraphqlClient-b87a9f4b.js',
  '/_elderjs/svelte/gradeToClass-ff33ce3d.js',
  '/_elderjs/svelte/iife/AutoComplete.f85777e1.js',
  '/_elderjs/svelte/iife/Breadcrumbs.93b60bf0.js',
  '/_elderjs/svelte/iife/Citation.9ca49690.js',
  '/_elderjs/svelte/iife/CityResults.5d73d4c0.js',
  '/_elderjs/svelte/iife/ContactForm.fb7fdbbf.js',
  '/_elderjs/svelte/iife/ContentFeedback.951f4885.js',
  '/_elderjs/svelte/iife/Debug.e8013483.js',
  '/_elderjs/svelte/iife/DebugRandom.288f76c2.js',
  '/_elderjs/svelte/iife/DevHeader.3fed4f84.js',
  '/_elderjs/svelte/iife/ElderDocsToc.4c05d5d1.js',
  '/_elderjs/svelte/iife/ExpertInfo.6fa59dcf.js',
  '/_elderjs/svelte/iife/Footer.ceec7d96.js',
  '/_elderjs/svelte/iife/Header.f3ca3fec.js',
  '/_elderjs/svelte/iife/HeaderAutoComplete.26629dea.js',
  '/_elderjs/svelte/iife/HeatmapCalendar.9cfa65ae.js',
  '/_elderjs/svelte/iife/HomeAutoComplete.c96894e5.js',
  '/_elderjs/svelte/iife/Icon.d83591cd.js',
  '/_elderjs/svelte/iife/Map.aa9b0128.js',
  '/_elderjs/svelte/iife/Modal.024c950d.js',
  '/_elderjs/svelte/iife/NewLineGraph.6879a8f5.js',
  '/_elderjs/svelte/iife/NursingHomeQuality.20f80404.js',
  '/_elderjs/svelte/iife/NursingHomeStats.09b4cebd.js',
  '/_elderjs/svelte/iife/Picture.5708fe7a.js',
  '/_elderjs/svelte/iife/ProviderMetrics.2b12768c.js',
  '/_elderjs/svelte/iife/Reporter.15652ef4.js',
  '/_elderjs/svelte/iife/SidebarArticles.af16ee1c.js',
  '/_elderjs/svelte/iife/SortableTable.5ae8ad90.js',
  '/_elderjs/svelte/iife/SparkBar.dada616b.js',
  '/_elderjs/svelte/iife/SparkLine.d80f27d7.js',
  '/_elderjs/svelte/iife/TableOfContents.1ed6e9eb.js',
  '/_elderjs/svelte/iife/TableOfContentsInner.cb4d9467.js',
  '/_elderjs/svelte/iife/Tooltip.6b1daec8.js',
  '/_elderjs/svelte/iife/ZoomableMap.b7e07005.js',
  '/_elderjs/svelte/index-726b3290.js',
  '/_elderjs/svelte/index-93540de1.js',
  '/_elderjs/svelte/index-c69e6f3c.js',
  '/_elderjs/svelte/index-eeba597f.js',
  '/_elderjs/svelte/line-076f4145.js',
  '/_elderjs/svelte/linear-da1408f9.js',
  '/_elderjs/svelte/scrollLock-21632a96.js',
  '/_elderjs/svelte/set-a2b5008c.js',
  '/_elderjs/svelte/slicedToArray-760fcf1e.js',
  '/_elderjs/svelte/transform-f8edf7db.js',
];
const ssrGlob = [
  path.resolve('./test/___ELDER___/compiled/_commonjsHelpers-bac6c35e.js'),
  path.resolve('./test/___ELDER___/compiled/api-6047c029.js'),
  path.resolve('./test/___ELDER___/compiled/components/AutoComplete/AutoComplete.js'),
  path.resolve('./test/___ELDER___/compiled/components/Breadcrumbs/Breadcrumbs.js'),
  path.resolve('./test/___ELDER___/compiled/components/Citation/Citation.js'),
  path.resolve('./test/___ELDER___/compiled/components/CityResults/CityResults.js'),
  path.resolve('./test/___ELDER___/compiled/components/CityResults/components/FilterIcon/FilterIcon.js'),
  path.resolve('./test/___ELDER___/compiled/components/CityResults/components/ProviderResult/ProviderResult.js'),
  path.resolve('./test/___ELDER___/compiled/components/ContactForm/ContactForm.js'),
  path.resolve('./test/___ELDER___/compiled/components/ContentFeedback/ContentFeedback.js'),
  path.resolve('./test/___ELDER___/compiled/components/Debug/Debug.js'),
  path.resolve('./test/___ELDER___/compiled/components/DevHeader/DevHeader.js'),
  path.resolve('./test/___ELDER___/compiled/components/ElderDocsToc/ElderDocsToc.js'),
  path.resolve('./test/___ELDER___/compiled/components/ExpertInfo/ExpertInfo.js'),
  path.resolve('./test/___ELDER___/compiled/components/Footer/Footer.js'),
  path.resolve('./test/___ELDER___/compiled/components/Header/Header.js'),
  path.resolve('./test/___ELDER___/compiled/components/HeaderAutoComplete/HeaderAutoComplete.js'),
  path.resolve('./test/___ELDER___/compiled/components/HeatmapCalendar/HeatmapCalendar.js'),
  path.resolve('./test/___ELDER___/compiled/components/HomeAutoComplete/HomeAutoComplete.js'),
  path.resolve('./test/___ELDER___/compiled/components/Icon/Icon.js'),
  path.resolve('./test/___ELDER___/compiled/components/Map/Map.js'),
  path.resolve('./test/___ELDER___/compiled/components/Modal/Modal.js'),
  path.resolve('./test/___ELDER___/compiled/components/NewLineGraph/NewLineGraph.js'),
  path.resolve('./test/___ELDER___/compiled/components/NursingHomeQuality/NursingHomeQuality.js'),
  path.resolve('./test/___ELDER___/compiled/components/NursingHomeStats/NursingHomeStats.js'),
  path.resolve('./test/___ELDER___/compiled/components/Picture/Picture.js'),
  path.resolve('./test/___ELDER___/compiled/components/ProviderMetrics/ProviderMetrics.js'),
  path.resolve('./test/___ELDER___/compiled/components/Reporter/Reporter.js'),
  path.resolve('./test/___ELDER___/compiled/components/SidebarArticles/SidebarArticles.js'),
  path.resolve('./test/___ELDER___/compiled/components/SortableTable/SortableTable.js'),
  path.resolve('./test/___ELDER___/compiled/components/SparkBar/SparkBar.js'),
  path.resolve('./test/___ELDER___/compiled/components/SparkLine/SparkLine.js'),
  path.resolve('./test/___ELDER___/compiled/components/TableOfContents/TableOfContents.js'),
  path.resolve('./test/___ELDER___/compiled/components/TableOfContents/TableOfContentsInner.js'),
  path.resolve('./test/___ELDER___/compiled/components/Tooltip/Tooltip.js'),
  path.resolve('./test/___ELDER___/compiled/components/ZoomableMap/components/StatePath/StatePath.js'),
  path.resolve('./test/___ELDER___/compiled/components/ZoomableMap/ZoomableMap.js'),
  path.resolve('./test/___ELDER___/compiled/getGrade9-d526721f.js'),
  path.resolve('./test/___ELDER___/compiled/getGraphqlClient-66bd8ec9.js'),
  path.resolve('./test/___ELDER___/compiled/gradeToClass-09c515da.js'),
  path.resolve('./test/___ELDER___/compiled/index-7c5449e6.js'),
  path.resolve('./test/___ELDER___/compiled/index-89e76156.js'),
  path.resolve('./test/___ELDER___/compiled/index-a037446f.js'),
  path.resolve('./test/___ELDER___/compiled/index-adf14f58.js'),
  path.resolve('./test/___ELDER___/compiled/index-f7610481.js'),
  path.resolve('./test/___ELDER___/compiled/index-fe301ba9.js'),
  path.resolve('./test/___ELDER___/compiled/layouts/Layout.js'),
  path.resolve('./test/___ELDER___/compiled/line-d105e021.js'),
  path.resolve('./test/___ELDER___/compiled/linear-4ac85e5c.js'),
  path.resolve('./test/___ELDER___/compiled/Map-138dd11f.js'),
  path.resolve('./test/___ELDER___/compiled/plugins/elder-plugin-debug-random/DebugRandom.js'),
  path.resolve('./test/___ELDER___/compiled/routes/cityNursingHomes/CityNursingHomes.js'),
  path.resolve('./test/___ELDER___/compiled/routes/content/article/Article.js'),
  path.resolve('./test/___ELDER___/compiled/routes/content/contact/Contact.js'),
  path.resolve('./test/___ELDER___/compiled/routes/content/Default.js'),
  path.resolve('./test/___ELDER___/compiled/routes/content/error/Error.js'),
  path.resolve('./test/___ELDER___/compiled/routes/content/finder/Finder.js'),
  path.resolve('./test/___ELDER___/compiled/routes/content/nursing-homes/NursingHomes.js'),
  path.resolve('./test/___ELDER___/compiled/routes/elderjs/Elderjs.js'),
  path.resolve('./test/___ELDER___/compiled/routes/experts/Expert.js'),
  path.resolve('./test/___ELDER___/compiled/routes/experts/Experts.js'),
  path.resolve('./test/___ELDER___/compiled/routes/home/Home.js'),
  path.resolve('./test/___ELDER___/compiled/routes/providerNursingHome/ProviderNursingHome.js'),
  path.resolve('./test/___ELDER___/compiled/routes/state/State.js'),
  path.resolve('./test/___ELDER___/compiled/routes/state/StatePage.js'),
  path.resolve('./test/___ELDER___/compiled/routes/tech/Tech.js'),
  path.resolve('./test/___ELDER___/compiled/set-1c9ff349.js'),
  path.resolve('./test/___ELDER___/compiled/transform-94f6a8c7.js'),
];

const clientGlob = [
  path.resolve('./test/public/_elderjs/svelte/asyncToGenerator-7ac7dd51.js'),
  path.resolve('./test/public/_elderjs/svelte/clickOutside-2fd623e0.js'),
  path.resolve('./test/public/_elderjs/svelte/components/AutoComplete/AutoComplete.c3c8f64b.js'),
  path.resolve('./test/public/_elderjs/svelte/components/Breadcrumbs/Breadcrumbs.4a1a1dbc.js'),
  path.resolve('./test/public/_elderjs/svelte/components/Citation/Citation.34f7a30f.js'),
  path.resolve('./test/public/_elderjs/svelte/components/CityResults/CityResults.53644339.js'),
  path.resolve('./test/public/_elderjs/svelte/components/CityResults/components/FilterIcon/FilterIcon.287858fc.js'),
  path.resolve(
    './test/public/_elderjs/svelte/components/CityResults/components/ProviderResult/ProviderResult.794e2c27.js',
  ),
  path.resolve('./test/public/_elderjs/svelte/components/ContactForm/ContactForm.431e5ea9.js'),
  path.resolve('./test/public/_elderjs/svelte/components/ContentFeedback/ContentFeedback.9e8eff3c.js'),
  path.resolve('./test/public/_elderjs/svelte/components/Debug/Debug.5566649a.js'),
  path.resolve('./test/public/_elderjs/svelte/components/DevHeader/DevHeader.2d1a5fa9.js'),
  path.resolve('./test/public/_elderjs/svelte/components/ElderDocsToc/ElderDocsToc.9b0b5d30.js'),
  path.resolve('./test/public/_elderjs/svelte/components/ExpertInfo/ExpertInfo.7fc76385.js'),
  path.resolve('./test/public/_elderjs/svelte/components/Footer/Footer.9bd22178.js'),
  path.resolve('./test/public/_elderjs/svelte/components/Header/Header.c4e04e55.js'),
  path.resolve('./test/public/_elderjs/svelte/components/HeaderAutoComplete/HeaderAutoComplete.35f2365f.js'),
  path.resolve('./test/public/_elderjs/svelte/components/HeatmapCalendar/HeatmapCalendar.3618695f.js'),
  path.resolve('./test/public/_elderjs/svelte/components/HomeAutoComplete/HomeAutoComplete.5b2c2c78.js'),
  path.resolve('./test/public/_elderjs/svelte/components/Icon/Icon.710fb2a2.js'),
  path.resolve('./test/public/_elderjs/svelte/components/Map/Map.88f594df.js'),
  path.resolve('./test/public/_elderjs/svelte/components/Modal/Modal.64c69955.js'),
  path.resolve('./test/public/_elderjs/svelte/components/NewLineGraph/NewLineGraph.42307a84.js'),
  path.resolve('./test/public/_elderjs/svelte/components/NursingHomeQuality/NursingHomeQuality.8933b643.js'),
  path.resolve('./test/public/_elderjs/svelte/components/NursingHomeStats/NursingHomeStats.c3d47bee.js'),
  path.resolve('./test/public/_elderjs/svelte/components/Picture/Picture.b76a12cd.js'),
  path.resolve('./test/public/_elderjs/svelte/components/ProviderMetrics/ProviderMetrics.c81798fd.js'),
  path.resolve('./test/public/_elderjs/svelte/components/Reporter/Reporter.3587cf62.js'),
  path.resolve('./test/public/_elderjs/svelte/components/SidebarArticles/SidebarArticles.81d6b578.js'),
  path.resolve('./test/public/_elderjs/svelte/components/SortableTable/SortableTable.708ad9c0.js'),
  path.resolve('./test/public/_elderjs/svelte/components/SparkBar/SparkBar.811ec65a.js'),
  path.resolve('./test/public/_elderjs/svelte/components/SparkLine/SparkLine.36332a3d.js'),
  path.resolve('./test/public/_elderjs/svelte/components/TableOfContents/TableOfContents.1c5f9df2.js'),
  path.resolve('./test/public/_elderjs/svelte/components/TableOfContents/TableOfContentsInner.dbc8fbbc.js'),
  path.resolve('./test/public/_elderjs/svelte/components/Tooltip/Tooltip.ee7f3e1f.js'),
  path.resolve('./test/public/_elderjs/svelte/components/ZoomableMap/components/StatePath/StatePath.c4699346.js'),
  path.resolve('./test/public/_elderjs/svelte/components/ZoomableMap/ZoomableMap.55372892.js'),
  path.resolve('./test/public/_elderjs/svelte/defineProperty-9f9de5d0.js'),
  path.resolve('./test/public/_elderjs/svelte/getBoundingBoxCenter-f2c146d1.js'),
  path.resolve('./test/public/_elderjs/svelte/getGrade9-6d7b61d1.js'),
  path.resolve('./test/public/_elderjs/svelte/getGraphqlClient-b87a9f4b.js'),
  path.resolve('./test/public/_elderjs/svelte/gradeToClass-ff33ce3d.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/AutoComplete.f85777e1.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/Breadcrumbs.93b60bf0.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/Citation.9ca49690.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/CityResults.5d73d4c0.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/ContactForm.fb7fdbbf.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/ContentFeedback.951f4885.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/Debug.e8013483.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/DebugRandom.288f76c2.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/DevHeader.3fed4f84.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/ElderDocsToc.4c05d5d1.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/ExpertInfo.6fa59dcf.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/Footer.ceec7d96.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/Header.f3ca3fec.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/HeaderAutoComplete.26629dea.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/HeatmapCalendar.9cfa65ae.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/HomeAutoComplete.c96894e5.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/Icon.d83591cd.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/Map.aa9b0128.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/Modal.024c950d.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/NewLineGraph.6879a8f5.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/NursingHomeQuality.20f80404.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/NursingHomeStats.09b4cebd.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/Picture.5708fe7a.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/ProviderMetrics.2b12768c.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/Reporter.15652ef4.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/SidebarArticles.af16ee1c.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/SortableTable.5ae8ad90.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/SparkBar.dada616b.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/SparkLine.d80f27d7.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/TableOfContents.1ed6e9eb.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/TableOfContentsInner.cb4d9467.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/Tooltip.6b1daec8.js'),
  path.resolve('./test/public/_elderjs/svelte/iife/ZoomableMap.b7e07005.js'),
  path.resolve('./test/public/_elderjs/svelte/index-726b3290.js'),
  path.resolve('./test/public/_elderjs/svelte/index-93540de1.js'),
  path.resolve('./test/public/_elderjs/svelte/index-c69e6f3c.js'),
  path.resolve('./test/public/_elderjs/svelte/index-eeba597f.js'),
  path.resolve('./test/public/_elderjs/svelte/line-076f4145.js'),
  path.resolve('./test/public/_elderjs/svelte/linear-da1408f9.js'),
  path.resolve('./test/public/_elderjs/svelte/scrollLock-21632a96.js'),
  path.resolve('./test/public/_elderjs/svelte/set-a2b5008c.js'),
  path.resolve('./test/public/_elderjs/svelte/slicedToArray-760fcf1e.js'),
  path.resolve('./test/public/_elderjs/svelte/transform-f8edf7db.js'),
];

beforeEach(() => {
  jest.resetModules();
});

jest.mock('glob', () => ({
  sync: jest
    .fn()
    .mockImplementationOnce(() => ssrGlob)
    .mockImplementationOnce(() => clientGlob)
    .mockImplementationOnce(() => ssrGlob)
    .mockImplementationOnce(() => clientGlob),
}));

describe('#prepareFindSvelteComponent', () => {
  beforeEach(() => {
    // needed to reinitialize the import with empty results
    jest.resetModules();
  });

  describe('#removeHash', () => {
    it(`Doesn't remove a hash when not needed`, () => {
      const str = '/_elderjs/svelte/components/AutoComplete/AutoComplete.js';
      expect(removeHash(str)).toBe(str);
    });

    it(`properly removes hashes from components in nested folders and even deeper folders`, () => {
      expect(
        hashedClientComponents
          .filter((c) => c.includes('components'))
          .map(removeHash)
          .filter((v, i) => i < 5),
      ).toEqual([
        '/_elderjs/svelte/components/AutoComplete/AutoComplete.js',
        '/_elderjs/svelte/components/Breadcrumbs/Breadcrumbs.js',
        '/_elderjs/svelte/components/Citation/Citation.js',
        '/_elderjs/svelte/components/CityResults/CityResults.js',
        '/_elderjs/svelte/components/CityResults/components/FilterIcon/FilterIcon.js', // deeper folder
      ]);
    });

    it(`properly removes hashes from components in non-nested`, () => {
      expect(
        [
          '/_elderjs/svelte/components/AutoComplete.123456.js',
          '/_elderjs/svelte/components/Breadcrumbs.123456.js',
          '/_elderjs/svelte/components/Citation.123456.js',
          '/_elderjs/svelte/components/CityResults.123456.js',
        ].map(removeHash),
      ).toEqual([
        '/_elderjs/svelte/components/AutoComplete.js',
        '/_elderjs/svelte/components/Breadcrumbs.js',
        '/_elderjs/svelte/components/Citation.js',
        '/_elderjs/svelte/components/CityResults.js',
      ]);
    });

    it(`properly removes hashes from iife deep`, () => {
      expect(
        hashedClientComponents
          .filter((c) => c.includes('iife'))
          .map(removeHash)
          .filter((v, i) => i < 5),
      ).toEqual([
        '/_elderjs/svelte/iife/AutoComplete.js',
        '/_elderjs/svelte/iife/Breadcrumbs.js',
        '/_elderjs/svelte/iife/Citation.js',
        '/_elderjs/svelte/iife/CityResults.js',
        '/_elderjs/svelte/iife/ContactForm.js',
      ]);
    });
  });

  describe('#findComponent', () => {
    const common = {
      ssrFolder: path.resolve(`./test/___ELDER___/compiled`),
      rootDir: path.resolve(`./test/`),
      clientComponents: path.resolve(`./test/public/_elderjs/svelte/`),
      distDir: path.resolve(`./test/public`),
    };

    const findComponent = prepareFindSvelteComponent(common);

    describe('absolute path', () => {
      it('finds item in components folder with hash', () => {
        const out = findComponent(
          path.resolve(common.rootDir, `./src/components/AutoComplete/AutoComplete.svelte`),
          'component',
        );
        expect(normalizeSnapshot(out)).toEqual({
          client: '/_elderjs/svelte/components/AutoComplete/AutoComplete.c3c8f64b.js',
          iife: '/_elderjs/svelte/iife/AutoComplete.f85777e1.js',
          ssr: windowsPathFix(
            path.resolve(common.rootDir, `./___ELDER___/compiled/components/AutoComplete/AutoComplete.js`),
          ),
        });
      });

      it('finds item in a sub folder of a route with hash', () => {
        const out = findComponent(
          path.resolve(common.rootDir, `./src/routes/content/article/Article.svelte`),
          'routes',
        );
        expect(normalizeSnapshot(out)).toEqual({
          client: undefined,
          iife: undefined,
          ssr: windowsPathFix(path.resolve(common.rootDir, `./___ELDER___/compiled/routes/content/article/Article.js`)),
        });
      });

      it('finds a layout', () => {
        const out = findComponent(path.resolve(common.rootDir, `./src/layouts/Layout.svelte`), 'layouts');
        expect(normalizeSnapshot(out)).toEqual({
          client: undefined,
          iife: undefined,
          ssr: windowsPathFix(path.resolve(common.rootDir, `./___ELDER___/compiled/layouts/Layout.js`)),
        });
      });
    });

    describe('name and folder search', () => {
      it('finds item in components folder by name', () => {
        const out = findComponent(`AutoComplete`, 'component');
        expect(normalizeSnapshot(out)).toEqual({
          client: '/_elderjs/svelte/components/AutoComplete/AutoComplete.c3c8f64b.js',
          iife: '/_elderjs/svelte/iife/AutoComplete.f85777e1.js',
          ssr: windowsPathFix(
            path.resolve(common.rootDir, `./___ELDER___/compiled/components/AutoComplete/AutoComplete.js`),
          ),
        });
      });

      it('finds item in components folder by name including ".svelte"', () => {
        const out = findComponent(`AutoComplete.svelte`, 'component');
        expect(normalizeSnapshot(out)).toEqual({
          client: '/_elderjs/svelte/components/AutoComplete/AutoComplete.c3c8f64b.js',
          iife: '/_elderjs/svelte/iife/AutoComplete.f85777e1.js',
          ssr: windowsPathFix(
            path.resolve(common.rootDir, `./___ELDER___/compiled/components/AutoComplete/AutoComplete.js`),
          ),
        });
      });

      it('finds a route by name', () => {
        const out = findComponent(`Article.svelte`, 'routes');
        expect(normalizeSnapshot(out)).toEqual({
          client: undefined,
          iife: undefined,
          ssr: windowsPathFix(path.resolve(common.rootDir, `./___ELDER___/compiled/routes/content/article/Article.js`)),
        });
      });

      it('finds a layout by name', () => {
        const out = findComponent(`Layout.svelte`, 'layouts');
        expect(normalizeSnapshot(out)).toEqual({
          client: undefined,
          iife: undefined,
          ssr: windowsPathFix(path.resolve(common.rootDir, `./___ELDER___/compiled/layouts/Layout.js`)),
        });
      });
    });
  });
});
