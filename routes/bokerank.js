const Router = require("koa-router");
const axios = require("axios");
const { get, set, del } = require("../utils/cacheData");

const bokerankRouter = new Router();

const routerInfo = {
  name: "bokerank",
  title: "播客排行",
  subtitle: "每日热门播客",
};

const cacheKey = "bokerankData";

let updateTime = new Date().toISOString();

const customHeaders = {
  "Accept-Encoding": "gzip, deflate, br",
  "Accept-Language": "zh-CN,zh;q=0.9",
  "Cache-Control": "max-age=0",
  //"If-Modified-Since": "Fri, 22 Sep 2023 19:33:17 GMT",
  //"If-None-Match": 'W/"650debfd-7ac"',
  "Sec-Ch-Ua": '"Brave";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": "macOS",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "same-origin",
  "Sec-Fetch-User": "?1",
  "Sec-Gpc": "1",
  "Upgrade-Insecure-Requests": "1",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
};

const axiosInstance = axios.create({
  headers: customHeaders
});

const extractJsURL = async (html) => {
  const regex = /<script type="module" crossorigin src="(https:\/\/xyzrank\.justinbot\.com\/assets\/index\.\w+\.js)"><\/script>/;
  const match = html.match(regex);
  return match ? match[1] : null;
};

const getJSONURLFromJS = async (jsURL) => {
  const response = await axiosInstance.get(jsURL);
  const regex = /const mI = "(https:\/\/xyzrank\.com\/assets\/hot-episodes\.\w+\.json)"/;
  const match = response.data.match(regex);
  return match ? match[1] : null;
};

const getDataFromJson = async (jsonURL) => {
  const response = await axiosInstance.get(jsonURL);
  return response.data.data.episodes.map(item => ({
    title: `${item.podcastName}:${item.title}`,
    url: item.link,
    mobileUrl: item.link,
    hot: item.playCount
  }));
};

bokerankRouter.get("/bokerank", async (ctx) => {
  let data = await get(cacheKey);
  const from = data ? "cache" : "server";

  if (!data) {
    const html = (await axiosInstance.get('https://xyzrank.com/')).data;
    const jsURL = extractJsURL(html);
    const jsonURL = await getJSONURLFromJS(jsURL);
    data = await getDataFromJson(jsonURL);
    await set(cacheKey, data);
    updateTime = new Date().toISOString();
  }

  ctx.body = {
    code: 200,
    message: "获取成功",
    ...routerInfo,
    from,
    updateTime,
    data
  };
});

bokerankRouter.get("/bokerank/new", async (ctx) => {
  const html = (await axiosInstance.get('https://xyzrank.com/')).data;
  const jsURL = extractJsURL(html);
  const jsonURL = await getJSONURLFromJS(jsURL);
  const newData = await getDataFromJson(jsonURL);
  await del(cacheKey);
  await set(cacheKey, newData);
  updateTime = new Date().toISOString();

  ctx.body = {
    code: 200,
    message: "获取成功",
    ...routerInfo,
    from: "server",
    updateTime,
    data: newData
  };
});

module.exports = bokerankRouter;
