"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Segmented } from "./Segmented";

export function TabSwitcher<T extends string>({ 
  options, 
  name = "tab", 
  defaultValue 
}: { 
  options: readonly { value: T; label: string; icon?: React.ReactNode }[]; 
  name?: string; 
  defaultValue: T;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const value = (searchParams.get(name) as T) || defaultValue;

  const handleChange = (val: T) => {
    const params = new URLSearchParams(searchParams);
    params.set(name, val);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return <Segmented options={options} value={value} onChange={handleChange} />;
}
