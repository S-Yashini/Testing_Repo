import ReactIcon from '@ant-design/icons-react';

type IconDefLike = {
  name?: unknown;
  theme?: unknown;
};

const iconApi = ReactIcon as unknown as {
  add?: (...icons: IconDefLike[]) => void;
};

if (typeof iconApi.add === 'function') {
  const originalAdd = iconApi.add.bind(iconApi);
  iconApi.add = (...icons: IconDefLike[]) => {
    const safeIcons = icons.filter(
      (icon) =>
        icon &&
        typeof icon === 'object' &&
        typeof icon.name === 'string' &&
        typeof icon.theme === 'string'
    );
    originalAdd(...safeIcons);
  };
}
