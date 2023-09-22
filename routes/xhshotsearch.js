const Router = require("koa-router");
const axios = require("axios");
const { get, set, del } = require("../utils/cacheData");

const xhshotsearchRouter = new Router();

const routerInfo = {
  name: "xhshotsearch",
  title: "小红书热搜",
  subtitle: "热搜",
};

const cacheKey = "xhshotsearchData";
const url = "https://edith.xiaohongshu.com/api/sns/v1/search/hot_list";

const headers = {
  "x-legacy-fid": "1695182528-0-0-63b29d709954a1bb8c8733eb2fb58f29",
  "xy-direction": 22,
  "x-xray-traceid": "c5589dd4090584f0d665967ecbd70541",
  "x-b3-traceid": "138c7d341c388db4",
  "x-mini-gid": "7dc4f3d168c355f1a886c54a898c6ef21fe7b9a847359afc77fc24ad",
  "accept-language": "zh-Hans-CN;q=1",
  "x-mini-sig": "04b34b5ab16c061892f155202ae7df67f303d96d8ebe6af24337a34b056b2526",
  "x-legacy-did": "C323D3A5-6A27-4CE6-AA0E-51C9D4C26A24",
  "x-net-core": "crn",
  "shield": "XYAAAAAQAAAAEAAABTAAAAUzUWEe4xG1IYD9/c+qCLOlKGmTtFa+lG434Oe+FTRagxxoaz6rUWSZ3+juJYz8RZqct+oNMyZQxLEBaBEL+H3i0RhOBVGrauzVSARchIWFYwbwkV",
  "x-legacy-smid": "20230920120211bd7b71a80778509cf4211099ea911000010d2f20f6050264",
  "xy-platform-info": "platform=iOS&version=8.7&build=8070515&deviceId=C323D3A5-6A27-4CE6-AA0E-51C9D4C26A24&bundle=com.xingin.discover",
  "mode": "gslb",
  "xy-common-params": "app_id=ECFAAF02&build=8070515&channel=AppStore&deviceId=C323D3A5-6A27-4CE6-AA0E-51C9D4C26A24&device_fingerprint=20230920120211bd7b71a80778509cf4211099ea911000010d2f20f6050264&device_fingerprint1=20230920120211bd7b71a80778509cf4211099ea911000010d2f20f6050264&device_model=phone&fid=1695182528-0-0-63b29d709954a1bb8c8733eb2fb58f29&gid=7dc4f3d168c355f1a886c54a898c6ef21fe7b9a847359afc77fc24ad&identifier_flag=0&lang=zh-Hans&launch_id=716882697&platform=iOS&project_id=ECFAAF&sid=session.1695189743787849952190&t=1695190591&teenager=0&tz=Asia/Shanghai&uis=light&version=8.7",
  "x-legacy-sid": "session.1695189743787849952190",
  "x-raw-ptr": 0,
  "referer": "https://app.xhs.cn/",
  "cookie": "acw_tc=2c0be1613d1a3c5a6d5cc9108c2172e9f4e0958c7ccf9908562a2dfb7f9014b8"
}

  ;

let updateTime = new Date().toISOString();

const getDataFromApi = async () => {
  const response = await axios.get(url, { headers });
  
  return response.data.data.items.map(item => ({
    title: item.title,
    url: `https://www.xiaohongshu.com/search_result?keyword=${item.title}`,
    mobileUrl: `https://www.xiaohongshu.com/search_result?keyword=${item.title}`,
    hot: item.score
  }));
};

xhshotsearchRouter.get("/xhshotsearch", async (ctx) => {
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

xhshotsearchRouter.get("/xhshotsearch/new", async (ctx) => {
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

module.exports = xhshotsearchRouter;
