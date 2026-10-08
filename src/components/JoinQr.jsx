import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function JoinQr() {
  const [image, setImage] = useState('');
  const address = typeof window === 'undefined' ? '' : window.location.origin;

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(address, {
      margin: 1,
      width: 360,
      color: { dark: '#2a2118', light: '#ffffff' },
    }).then((url) => {
      if (alive) setImage(url);
    }).catch(() => {});
    return () => {
      alive = false;
    };
  }, [address]);

  return (
    <figure className="join-qr">
      {image && <img src={image} width="168" height="168" alt="독서기록장으로 들어오는 큐알 코드" />}
      <figcaption>
        다른 휴대폰은 이 코드를 찍어 들어와요.
        <span>{address.replace(/^https?:\/\//, '')}</span>
      </figcaption>
    </figure>
  );
}
