const Router = require("koa-router");
const axios = require("axios");
const cheerio = require("cheerio");
const { get, set } = require("../utils/cacheData");

const caixinRouter = new Router();
const cacheKey = "caixinData";
const url = "https://www.caixin.com/";

const getData = async () => {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    const hotList = [];
    const selector = 'body > div:nth-child(2) > div:nth-child(5) > div:nth-child(1) > div:nth-child(2) > dl:nth-child(1) > dd > p';
    $(selector).each((i, el) => {
        const news = $(el).text().trim();
        hotList.push(news);
    });

    return hotList;
};

caixinRouter.get("/caixin", async (ctx) => {
    let data = await get(cacheKey);
    if (!data) {
        data = await getData();
        await set(cacheKey, data);
    }
    ctx.body = {
        code: 200,
        message: "获取成功",
        name: "caixin",
        title: "财新网",
        subtitle: "热榜",
        data
    };
});

module.exports = caixinRouter;
