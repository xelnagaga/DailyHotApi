const Router = require("koa-router");
const axios = require("axios");
const cheerio = require("cheerio");
const { get, set, del } = require("../utils/cacheData");

const wxRouter = new Router();

const routerInfo = {
  name: "weixin",
  title: "微信",
  subtitle: "热文榜",
};

const cacheKey = "wxData";
let updateTime = new Date().toISOString();
const url = "https://www.gsdata.cn/rank/wxarc";

const getData = (html) => {
  const $ = cheerio.load(html);
  const dataList = [];

  $("#rank_data tbody tr").each((i, element) => {
    const originalTitle = $(element).find("td.al a").text();
    const author = $(element).find("td:nth-child(2)").text();
    const title = `${author}：${originalTitle}`;
    const url = $(element).find("td.al a").attr("href");
    const hot = parseInt($(element).find("td:nth-child(5)").text(), 10);

    dataList.push({
      title,
      url,
      mobileUrl: url,
      hot
    });
  });

  return dataList;
};

wxRouter.get("/weixin", async (ctx) => {
  let data = await get(cacheKey);
  const from = data ? "cache" : "server";

  if (!data) {
    const response = await axios.get(url);
    data = getData(response.data);
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
    data
  };
});

wxRouter.get("/weixin/new", async (ctx) => {
  try {
    const response = await axios.get(url);
    const newData = getData(response.data);
    updateTime = new Date().toISOString();
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

module.exports = wxRouter;
