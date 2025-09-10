import React from 'react';

export default function ThemeStyle({ css }: { css: string }) {
  if (!css) return null;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

