import { ExternalLink, ImageOff, WifiOff } from 'lucide-react';
import { useState } from 'react';
import type { ReferenceImage } from '../../domain/schemas/project';

interface ReferenceGalleryProps {
  images: ReferenceImage[];
}

function ReferenceCard({ image }: { image: ReferenceImage }) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className="reference-card">
      {failed ? (
        <div className="reference-fallback" role="img" aria-label={image.caption + '（图片未加载）'}>
          <ImageOff aria-hidden="true" />
          <strong>参考照片未加载</strong>
          <span>离线时请使用文字说明；联网后可打开原图。</span>
        </div>
      ) : (
        <img
          src={image.url}
          alt={image.caption}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
      <figcaption>
        <strong>{image.caption}</strong>
        <span>{image.author} · {image.license}</span>
        <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer">
          查看原图与署名 <ExternalLink aria-hidden="true" />
        </a>
      </figcaption>
    </figure>
  );
}

export function ReferenceGallery({ images }: ReferenceGalleryProps) {
  if (images.length === 0) return null;

  return (
    <div className="gallery-wrap">
      <div className="gallery-label"><WifiOff aria-hidden="true" />本步骤参考图 · 需要联网</div>
      <div className="reference-gallery" aria-label="现场机位参考图">
        {images.map((image) => <ReferenceCard key={image.sourceUrl} image={image} />)}
      </div>
    </div>
  );
}
