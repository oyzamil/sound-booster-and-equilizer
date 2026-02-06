import React from 'react';
import { SoundFilled, SoundOutlined } from '@ant-design/icons';

interface VolumeIconProps {
  muted: boolean;
  className?: string;
}

export const VolumeIcon: React.FC<VolumeIconProps> = ({ muted, className }) => {
  return muted ? <SoundOutlined className={className} /> : <SoundFilled className={className} />;
};
