// Paste this into the browser console on the page where no status field appears.
// It reports which detection signal is missing, without needing the extension.
//
// Chrome/Firefox: F12 -> Console -> paste -> Enter.

(() => {
    const url = location.href;
    const isAmazon = location.hostname.includes('amazon.');
    const isGoodreads = location.hostname.includes('goodreads.');

    const report = {
        url,
        site: isAmazon ? 'amazon' : isGoodreads ? 'goodreads' : 'unsupported'
    };

    if (isAmazon) {
        const nav = document.querySelector('#nav-subnav');
        const details = document.querySelector(
            '#detailBullets_feature_div, #productDetails_techSpec_section_1, ' +
            '#productDetailsTable, #rich_product_information, #detailBulletsWrapper_feature_div'
        );
        const crumbs = document.querySelector('#wayfinding-breadcrumbs_feature_div');

        report.isProductPage = url.includes('/dp/') || url.includes('/gp/product/');
        report.navSubnavPresent = Boolean(nav);
        report.navDataCategory = nav?.dataset?.category ?? null;
        report.hasKindleTitle = Boolean(document.querySelector('#ebooksProductTitle, #ebooksTitle'));
        report.hasBookBreadcrumb = /\b(Bücher|Kindle-Shop|Hörbücher)\b/i.test(crumbs?.textContent || '');
        report.hasBookDetails =
            /\b(ISBN|Seitenzahl|Print-Länge|Verlag|Herausgeber|Taschenbuch|Gebundene Ausgabe|Hörbuch)\b/i
                .test(details?.textContent || '');
        report.anchorFound =
            ['#productTitle', '#ebooksProductTitle', '#title',
             '#detailBulletsWrapper_feature_div', '#detailBullets_feature_div', '#dp-container']
                .find((s) => document.querySelector(s)) ?? null;
        report.titleRead =
            ['#productTitle', '#ebooksProductTitle', '#title', 'h1 span.a-text-bold']
                .map((s) => document.querySelector(s)?.textContent?.trim())
                .find(Boolean) ?? null;
        report.wouldBeRecognised =
            report.isProductPage &&
            (report.navDataCategory === 'books-catalog' ||
             report.navDataCategory === 'digital-text' ||
             report.hasKindleTitle || report.hasBookBreadcrumb || report.hasBookDetails);
    }

    if (isGoodreads) {
        report.isProductPage = url.includes('/book/show/');
        report.titleRead = document.querySelector('h1[data-testid="bookTitle"]')?.textContent?.trim() ?? null;
        report.wouldBeRecognised = report.isProductPage;
    }

    report.statusFieldPresent = Boolean(document.getElementById('onleihe-checker-status'));
    report.contentScriptRan = Boolean(document.getElementById('onleihe-checker-status'));

    console.table(report);
    console.log('Copy this output:', JSON.stringify(report, null, 2));
    return report;
})();
