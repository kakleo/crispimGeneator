import config from '@payload-config';
import '@payloadcms/next/css';
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts';
import React from 'react';
import { importMap } from './admin/importMap.js';

type Args = {
  children: React.ReactNode;
};

export const metadata = {
  title: 'Payload Admin - Nusa Flores Travel',
  description: 'Tour Proposal CMS Admin',
};

const Layout = ({ children }: Args) => (
  <RootLayout
    config={config}
    importMap={importMap}
    serverFunction={async (args) => {
      'use server';
      return handleServerFunctions({
        ...args,
        config,
        importMap,
      });
    }}
  >
    {children}
  </RootLayout>
);

export default Layout;
