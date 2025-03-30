const Brand = require('../../models/Brand');
const ProductGroup  = require('../../models/ProductGroup');
const BlogGroup  = require('../../models/BlogGroup');

module.exports.headerInfo = async (req, res, next) => {
    // Fetch and separate product groups
    const pgLst = await ProductGroup.findAll();
    const parentGroups = pgLst.filter(pg => !pg.parentGroupId);

    // Build groups map (parent -> child groups)
    const groups = {};
    parentGroups.forEach(pg => {
        const childGroups = pgLst
            .filter(pgr => pgr.parentGroupId && pgr.parentGroupId === pg.productGroupId && pgr.productGroupId !== pg.productGroupId)
            .map(pgr => pgr.groupName);
        groups[pg.groupName] = childGroups;
    });

    // Store in session
    const brands = await Brand.findAll();
    const blogGroups =await BlogGroup.findAll();

    res.locals.groups = groups;
    res.locals.brands = brands;
    res.locals.blogGroups = blogGroups;
    
    next();
}