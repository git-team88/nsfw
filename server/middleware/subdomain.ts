import { defineEventHandler } from 'h3';

export default defineEventHandler((event) => {
  const host = event.node.req.headers.host || '';
  const subdomain = host.split('.')[0];
  
  event.context.subdomain = subdomain;
  
  const subdomainMap: Record<string, string> = {
    'novel': '/',
    'comic': '/comic',
    'video': '/video'
  };
  
  if (subdomainMap[subdomain]) {
    event.context.redirectPath = subdomainMap[subdomain];
  }
});
