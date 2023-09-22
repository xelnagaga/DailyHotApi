const Router = require("koa-router");
const axios = require("axios");
const { get, set, del } = require("../utils/cacheData");

const flipboardRouter = new Router();

const routerInfo = {
  name: "flipboard",
  title: "红板报Flipboard",
  subtitle: "公众号深度热榜",
};

const cacheKey = "flipboardData";
const url = "https://fbchina.flipchina.cn/v1/users/updateFeed/8009213726?udid=06b65d06a30b074f30119c0e96ca84603d004454&tuuid=66654453-4020-4126-BE9A-1837F8CD7AD1&ver=5.5.1&sections=flipboard/curator/magazine/tgyHVfgoSZWLq7iU4vyYKA:m:7000000606&limit=200";

const headers = {
  "x-flipboard-user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Flipboard/5.5.1",
  "accept-language": "zh-CN,zh-Hans;q=0.9"
};

let updateTime = new Date().toISOString();

const getDataFromApi = async () => {
    const response = await axios.get(url, { headers });
    
    const lines = response.data.split('\n');  // 按行分割
    const objects = lines
      .filter(line => line.trim() !== '')  // 过滤掉空行
      .map(line => {
        try {
          return JSON.parse(line);  // 尝试进行JSON解析
        } catch (error) {
          console.error('Failed to parse line:', line);  // 如果解析失败，打印错误信息
          return null;  // 返回null
        }
      })
      .filter(obj => obj !== null);  // 过滤掉null
  
    const posts = objects.filter(obj => obj.type === 'post');  // 过滤出类型为'post'的对象
    
    return posts.map(post => ({  // 对每个'post'对象进行映射
      title: post.title,
      url: post.sourceURL,
      mobileUrl: post.sourceURL,
      hot: post.playCount,
      desc: post.excerptText
    }));
  };

flipboardRouter.get("/flipboard", async (ctx) => {
  try {
    let data = await get(cacheKey);
    const from = data ? "cache" : "server";
    
    if (!data) {
      data = await getDataFromApi();
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
  } catch (error) {
    console.error(error);
    
    const cachedData = await get(cacheKey);
    if (cachedData) {
      ctx.body = {
        code: 200,
        message: "获取成功",
        ...routerInfo,
        from: "cache",
        updateTime,
        data: cachedData
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

flipboardRouter.get("/flipboard/new", async (ctx) => {
  try {
    const newData = await getDataFromApi();
    updateTime = new Date().toISOString();
    
    await del(cacheKey);
    await set(cacheKey, newData);

    ctx.body = {
      code: 200,
      message: "获取成功",
      ...routerInfo,
      from: "server",
      updateTime,
      data: newData
    };
  } catch (error) {
    console.error(error);
    
    const cachedData = await get(cacheKey);
    if (cachedData) {
      ctx.body = {
        code: 200,
        message: "获取成功",
        ...routerInfo,
        from: "cache",
        updateTime,
        data: cachedData
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

module.exports = flipboardRouter;