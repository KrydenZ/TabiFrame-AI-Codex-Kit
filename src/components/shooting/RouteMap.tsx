import { ExternalLink, Map as MapIcon, MapPinned } from 'lucide-react';
import type { RouteMap as RouteMapData } from '../../domain/schemas/project';
import { scrollToSection } from '../../lib/scrollToSection';

const TILE_SIZE = 256;
const MAP_ASPECT = 16 / 9;

function projectPoint(lat: number, lng: number, zoom: number) {
  const scale = 2 ** zoom * TILE_SIZE;
  const latitude = Math.max(-85, Math.min(85, lat)) * Math.PI / 180;
  return {
    x: (lng + 180) / 360 * scale,
    y: (1 - Math.log(Math.tan(latitude) + 1 / Math.cos(latitude)) / Math.PI) / 2 * scale,
  };
}

function buildScene(routeMap: RouteMapData) {
  const projected = routeMap.stops.map((stop) => ({ ...projectPoint(stop.lat, stop.lng, routeMap.zoom), stop }));
  const placedMarkers: Array<{ markerX: number; markerY: number }> = [];
  const points = projected.map((point, index) => {
    let markerX = point.x;
    let markerY = point.y;
    for (let attempt = 0; attempt < 7; attempt += 1) {
      const overlaps = placedMarkers.some((placed) => Math.hypot(markerX - placed.markerX, markerY - placed.markerY) < 26);
      if (!overlaps) break;
      const angle = (index * 137.5 + attempt * 47) * Math.PI / 180;
      const radius = 25 + attempt * 7;
      markerX = point.x + Math.cos(angle) * radius;
      markerY = point.y + Math.sin(angle) * radius;
    }
    placedMarkers.push({ markerX, markerY });
    return { ...point, markerX, markerY };
  });
  const minX = Math.min(...points.flatMap((point) => [point.x, point.markerX]));
  const maxX = Math.max(...points.flatMap((point) => [point.x, point.markerX]));
  const minY = Math.min(...points.flatMap((point) => [point.y, point.markerY]));
  const maxY = Math.max(...points.flatMap((point) => [point.y, point.markerY]));
  let width = Math.max(400, maxX - minX + 190);
  let height = Math.max(225, maxY - minY + 170);
  if (width / height < MAP_ASPECT) width = height * MAP_ASPECT;
  else height = width / MAP_ASPECT;
  const x = (minX + maxX - width) / 2;
  const y = (minY + maxY - height) / 2;
  const tiles = [];
  const tileZoom = Math.min(routeMap.zoom + 1, 18);
  const density = 2 ** (tileZoom - routeMap.zoom);
  const tileDisplaySize = TILE_SIZE / density;
  const limit = 2 ** tileZoom;
  for (let tileY = Math.floor(y / tileDisplaySize); tileY <= Math.floor((y + height) / tileDisplaySize); tileY += 1) {
    if (tileY < 0 || tileY >= limit) continue;
    for (let tileX = Math.floor(x / tileDisplaySize); tileX <= Math.floor((x + width) / tileDisplaySize); tileX += 1) {
      const wrappedX = ((tileX % limit) + limit) % limit;
      tiles.push({ tileX, tileY, size: tileDisplaySize, url: `https://tile.openstreetmap.org/${tileZoom}/${wrappedX}/${tileY}.png` });
    }
  }
  return {
    points,
    tiles,
    viewBox: `${x} ${y} ${width} ${height}`,
    viewport: { x, y, width, height },
    center: routeMap.stops[Math.floor(routeMap.stops.length / 2)],
  };
}

export function RouteMap({ routeMap, isVisited = false }: { routeMap: RouteMapData; isVisited?: boolean }) {
  const scene = buildScene(routeMap);
  const openMapUrl = `https://www.openstreetmap.org/#map=${routeMap.zoom}/${scene.center.lat}/${scene.center.lng}`;

  return (
    <section className="route-map-card" aria-labelledby="route-map-title">
      <header className="route-map-heading">
        <div className="route-map-title"><MapPinned aria-hidden="true" /><div><span>ROUTE MAP</span><h2 id="route-map-title">{routeMap.title}</h2></div></div>
        <a href={openMapUrl} target="_blank" rel="noopener noreferrer">在 OpenStreetMap 打开 <ExternalLink aria-hidden="true" /></a>
      </header>
      <p>{routeMap.summary}</p>
      <div className="route-map-canvas">
        <svg viewBox={scene.viewBox} role="img" aria-label={`${routeMap.title}，共 ${routeMap.stops.length} 个主要地点`} preserveAspectRatio="xMidYMid slice">
          <title>{routeMap.title}</title>
          <rect className="route-map-base" x="-100000" y="-100000" width="200000" height="200000" />
          {scene.tiles.map((tile) => <image key={`${tile.tileX}-${tile.tileY}`} href={tile.url} x={tile.tileX * tile.size} y={tile.tileY * tile.size} width={tile.size} height={tile.size} preserveAspectRatio="none" />)}
        </svg>
        <div className="route-map-markers">
          {scene.points.map((point, index) => {
            const style = {
              left: `${(point.markerX - scene.viewport.x) / scene.viewport.width * 100}%`,
              top: `${(point.markerY - scene.viewport.y) / scene.viewport.height * 100}%`,
            };
            const label = `${index + 1} · ${point.stop.label}`;
            return point.stop.sectionId
              ? <button key={point.stop.id} type="button" className="route-map-marker-button" onClick={() => scrollToSection(point.stop.sectionId!)} style={style} aria-label={`查看${label}`} title={label}><span>{index + 1}</span></button>
              : <span key={point.stop.id} className="route-map-marker-button" style={style} aria-label={label} title={label}><span>{index + 1}</span></span>;
          })}
        </div>
        <div className="route-map-attribution"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a></div>
      </div>
      <div className="route-map-legend"><span><MapIcon aria-hidden="true" />OpenStreetMap 在线地图</span></div>
      <ol className="route-map-stops">
        {routeMap.stops.map((stop, index) => (
          <li key={stop.id}>
            <span>{index + 1}</span>
            <div>{stop.sectionId ? <button type="button" onClick={() => scrollToSection(stop.sectionId!)}>{stop.label}</button> : <strong>{stop.label}</strong>}{stop.detail && <small>{stop.detail}</small>}</div>
          </li>
        ))}
      </ol>
      <p className="route-map-disclaimer">{isVisited
        ? '地图按项目资料标出主要地点，不代表实际轨迹或定位记录；可在“修改与编排”中按真实经历调整步骤。'
        : '地图为拍摄策划示意，不提供实时导航、班次或现场通行保证；出发前请以当日交通和现场标识为准。'}</p>
    </section>
  );
}
