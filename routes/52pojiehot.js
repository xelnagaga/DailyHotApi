const Router = require("koa-router");
const pjRouter = new Router();
const axios = require("axios");
const cheerio = require('cheerio');
const { get, set, del } = require("../utils/cacheData");
const { TextDecoder } = require('util');

const routerInfo = {
  name: "52pojie",
  title: "52破解",
  subtitle: "热榜",
};

const cacheKey = "pjData";

let updateTime = new Date().toISOString();

const url = "https://www.52pojie.cn/forum.php?mod=guide&view=hot";

const getData = (html) => {
    const $ = cheerio.load(html);
    const dataList = [];

    $('th.common').each((index, element) => {
        const titleElem = $(element).find('a.xst');
        const title = titleElem.text().trim();
        const url = 'https://www.52pojie.cn/' + titleElem.attr('href');
        const mobileUrl = url; // Assuming mobile URL is the same

        dataList.push({
            title: title,
            url: url,
            mobileUrl: mobileUrl
        });
    });

    return dataList;
};

pjRouter.get("/52pojie", async (ctx) => {
  console.log("获取52破解热榜");
  try {
    let data = await get(cacheKey);
    const from = data ? "cache" : "server";
    if (!data) {
      console.log("从服务端重新获取52破解热榜");
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const decoder = new TextDecoder('gbk');  // Specify the encoding here
      const html = decoder.decode(response.data);
      data = getData(html);
      updateTime = new Date().toISOString();
      await set(cacheKey, data);
    }
    ctx.body = {
      code: 200,
      message: "获取成功",
      ...routerInfo,
      from,
      total: data.length,
      updateTime,
      data,
    };
  } catch (error) {
    console.error(error);
    ctx.body = {
      code: 500,
      ...routerInfo,
      message: "获取失败",
    };
  }
});







pjRouter.get("/52pojie/new", async (ctx) => {
  console.log("获取52破解热榜 - 最新数据");
  try {
    const response = await axios.get(url);
    const newData = getData(response.data);
    updateTime = new Date().toISOString();
    console.log("从服务端重新获取52破解热榜");

    ctx.body = {
      code: 200,
      message: "获取成功",
      ...routerInfo,
      total: newData.length,
      updateTime,
      data: newData,
    };

    await del(cacheKey);
    await set(cacheKey, newData);
  } catch (error) {
    console.error(error);
    const cachedData = await get(cacheKey);
    if (cachedData) {
      ctx.body = {
        code: 200,
        message: "获取成功",
        ...routerInfo,
        total: cachedData.length,
        updateTime,
        data: cachedData,
      };
    } else {
      ctx.body = {
        code: 500,
        ...routerInfo,
        message: "获取失败",
      };
    }
  }
});

pjRouter.info = routerInfo;
module.exports = pjRouter;
