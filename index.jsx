/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from 'react';
import geoJsonData from '@/utils/geoJson.js';
import { getActivityInfo } from '@/services/home';
import { safeValue } from '@/utils';
import { connect } from 'dva';
import point1 from '@/assets/images/f1.png';
import point2 from '@/assets/images/f2.png';
import point3 from '@/assets/images/f3.png';
import point4 from '@/assets/images/f4.png';
import point5 from '@/assets/images/map_icon3.png';
import point6 from '@/assets/images/map_icon4.png';
import map_a from '@/assets/images/icon/map_a.png';
import map_b from '@/assets/images/icon/map_b.png';
import map_c from '@/assets/images/icon/map_c.png';
import map_icon2 from '@/assets/images/map_icon2.png';
import styles from './index.scss';

const AMap = window.AMap;
let map = {};
let markers = [];
let polygonArr = [];
let cluster;
const amapConfig = {
  amapkey: '64fc42508ce486b03a6fcff2e8c0d05f',
  version: '1.4.15',
  resizeEnable: true,
  mapStyle: 'amap://styles/darkblue',
  zoom: 7.5,
  zooms: [7.5, 18],
  labelzIndex: 112,
  viewMode: '3D',
  pitch: 5,
  center: [120.212999823, 29.2],
};

export default connect(({ home }) => {
  return {
    activityNum: home.activityNum,
    zhiMapData: home.zhiMapData,
  };
})(({ zhiMapData = [], floatTabIndex = 0, activityNum = [], dispatch }) => {
  const [modalIdx, setModalIdx] = useState(-1);
  const [complete, setComplete] = useState(false);
  const singerPol = useRef();

  // 展示信息窗体
  const showInfoWindow = (info, e) => {
    const {
      activityName = '--',
      detailAddress = '--',
      contactorName = '--',
      activityPic = '',
    } = info;
    const infoWindow = new AMap.InfoWindow({
      isCustom: true,
      offset: new AMap.Pixel(220, 130),
      closeWhenClickMap: true,
    });
    const infoNode = `<div class=${styles.content} style="height: 140px">
      <div class=${styles.title}>
        <img src=${map_icon2} alt="" />
        志愿活动信息
      </div>
      <div class=${styles.contentWrap}>
        <img class=${styles.rec} src=${activityPic} alt="" />
        <div class=${styles.right}>
          <p>
            <img src=${map_c} alt="" />
            ${activityName}
          </p>
          <p>
            <img src=${map_b} alt="" />
            活动地点：${detailAddress ?? '--'}
          </p>
          <p>
            <img src=${map_a} alt="" />
            活动发布者：${contactorName}
          </p>
        </div>
      </div>
    </div>`;
    infoWindow.setContent(infoNode);
    infoWindow.open(map, e.target.getPosition());
  };

  const markerClick = async e => {
    const originData = e.target.getExtData();
    const res = await getActivityInfo({ timesId: originData.timesId });
    if (safeValue(res, 'data.success')) {
      const data = safeValue(res, 'data.data', []);
      showInfoWindow(data[0], e);
    }
  };

  // 绘制标记点
  const drawMarker = () => {
    // marker
    const newData = zhiMapData.map((item, index) => ({
      lnglat: [item.mapLongitude, item.mapLatitude], //点标记位置
      ...item,
    }));
    for (var i = 0; i < newData.length; i += 1) {
      let markerInstance = new AMap.Marker({
        position: newData[i]['lnglat'],
        // content:
        //   '<div style="background-color: hsla(180, 100%, 50%, 0.7); height: 24px; width: 24px; border: 1px solid hsl(180, 100%, 40%); border-radius: 12px; box-shadow: hsl(180, 100%, 50%) 0px 0px 1px;"></div>',
        content: `<div class=${styles.smallMark}><img src=${
          newData[i].activityType === 1 ? point6 : point5
        } /></div>`,
        offset: new AMap.Pixel(-15, -15),
      });
      markerInstance.setExtData(newData[i]);
      markerInstance.on('click', markerClick);
      markers.push(markerInstance);
    }
    cluster = new AMap.MarkerClusterer(map, markers, {
      styles: [
        {
          url: point4,
          size: new AMap.Size(28, 34),
          textColor: '#fff',
        },
        {
          url: point3,
          size: new AMap.Size(28, 34),
          textColor: '#fff',
        },
        {
          url: point2,
          size: new AMap.Size(28, 34),
          textColor: '#fff',
        },
        {
          url: point1,
          size: new AMap.Size(39, 48),
          textColor: '#fff',
        },
        // {
        //   url: point1,
        //   size: new AMap.Size(28, 34),
        //   textColor: '#fff',
        // },
      ],
      gridSize: 60,
      maxZoom: 12,
    });
  };

  useEffect(() => {
    map = new AMap.Map('mapContainer', amapConfig);
    // 地图加载完成
    map.on('complete', () => {
      setComplete(true);
    });
    // map.on('zoomend', () => {
    //   //监听zoom级别
    //   console.log('zokm',map.getZoom())
    // });
    // const bounds = map.getBounds();
    // map.setLimitBounds(bounds);
    return () => {
      markers = [];
      map.destroy();
    };
  }, []);

  useEffect(() => {
    if (complete) {
      dispatch({
        type: 'home/getZhiMapData',
      });
      dispatch({ type: 'home/getActivityNum' });
    }
  }, [complete]);

  useEffect(() => {
    if (complete) {
      map.getAllOverlays('marker') && map.remove(map.getAllOverlays('marker'));
      markers = [];
      drawMarker();
    }
  }, [complete, zhiMapData]);

  useEffect(() => {
    if (complete) {
      polygonArr.map(item => {
        map.remove(item);
      });
      polygonArr = [];
      new AMap.DistrictSearch({
        extensions: 'all',
        subdistrict: 3,
        // 设置查询行政区级别为 区
        level: 'province',
      }).search('浙江省', function(status, result) {
        // 外多边形坐标数组和内多边形坐标数组
        const outer = [
          new AMap.LngLat(-360, 90, true),
          new AMap.LngLat(-360, -90, true),
          new AMap.LngLat(360, -90, true),
          new AMap.LngLat(360, 90, true),
        ];
        const holes = result.districtList[0].boundaries;

        const pathArray = [outer];
        pathArray.push.apply(pathArray, holes);
        const polygon = new AMap.Polygon({
          zIndex: 100,
          pathL: pathArray,
          //线条颜色，使用16进制颜色代码赋值。默认值为#006600
          strokeColor: '#16FFFF',
          strokeWeight: 1,
          //轮廓线透明度，取值范围[0,1]，0表示完全透明，1表示不透明。默认为0.9
          strokeOpacity: 1,
          //多边形填充颜色，使用16进制颜色代码赋值，如：#FFAA00
          fillColor: 'rgba(0,0,0)',
          //多边形填充透明度，取值范围[0,1]，0表示完全透明，1表示不透明。默认为0.9
          fillOpacity: 0,
          //轮廓线样式，实线:solid，虚线:dashed
          strokeStyle: 'solid',
          strokeDasharray: [10, 2, 10],
        });
        polygon.setPath(pathArray);
        map.add(polygon);
      });
      geoJsonData.map(item => {
        return drawPolygon(item.geometry.coordinates[0], item.properties);
      });
    }
  }, [complete, activityNum]);

  useEffect(() => {
    singerPol.current && map.remove(singerPol.current);
    if (complete) {
      geoJsonData.map(item => {
        if (item.properties.subFeatureIndex === modalIdx) {
          return drawSingerPolygon(item.geometry.coordinates[0], item.properties);
        }
      });
    }
  }, [complete, modalIdx]);

  // 选中区域的
  const drawSingerPolygon = (path, properties) => {
    const style = {
      strokeWeight: 3,
      cursor: 'pointer',
      strokeStyle: 'solid',
      fillColor: '#3196FA',
      fillOpacity: 0.5,
      strokeColor: '#16FFFF',
    };
    const polygon = new AMap.Polygon({
      ...style,
      path: path,
      zIndex: 50,
    });
    map.add(polygon);
    singerPol.current = polygon;
  };

  // 画出所有区域
  const drawPolygon = (path, properties) => {
    const { name, subFeatureIndex } = properties;
    const style = {
      strokeWeight: 1,
      cursor: 'pointer',
      strokeStyle: 'solid',
      fillColor: '#3196FA',
      fillOpacity: 0.4,
      strokeColor: '#16FFFF',
    };

    const polygon = new AMap.Polygon({
      ...style,
      path: path,
      zIndex: 50,
    }).on('click', e => clickGeoArea(e, style, subFeatureIndex, name));
    map.add(polygon);
    polygonArr.push(polygon);
  };

  const clickGeoArea = (evt, style, subFeatureIndex, name) => {
    setModalIdx(subFeatureIndex);
    const value = activityNum.find(item => item.city === name)?.activity_num;
    const infoWindow = new AMap.InfoWindow({
      isCustom: true,
      content: `<div class=${styles.infoNum}>${value}</div>`, //使用默认信息窗体框样式，显示信息内容
    });
    const { lnglat } = evt;
    infoWindow.open(map, lnglat);
  };

  return <div className={styles.mapArea} id="mapContainer"></div>;
});
