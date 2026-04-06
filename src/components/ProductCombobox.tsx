import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type ProductOption = {
  sku: string;
  name: string;
};

type ProductComboboxProps = {
  products: ProductOption[];
  value: string;
  onChange: (sku: string) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
};

export function ProductCombobox({
  products,
  value,
  onChange,
  placeholder = "Selecionar produto",
  emptyText = "Nenhum produto encontrado",
  disabled = false,
}: ProductComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedProduct = useMemo(() => {
    return products.find(
      (product) => product.sku.trim().toLowerCase() === value.trim().toLowerCase()
    );
  }, [products, value]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return products;

    return products.filter((product) => {
      const sku = product.sku.toLowerCase();
      const name = product.name.toLowerCase();

      return sku.includes(term) || name.includes(term);
    });
  }, [products, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-11 w-full justify-between rounded-lg border-border bg-background px-3 font-normal hover:bg-background",
            !selectedProduct && "text-muted-foreground"
          )}
        >
          <span className="truncate text-left">
            {selectedProduct
              ? `${selectedProduct.sku} — ${selectedProduct.name}`
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0"
      >
        <Command shouldFilter={false}>
          <div className="flex items-center border-b border-border px-3">
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <CommandInput
              placeholder="Buscar por SKU ou nome..."
              value={search}
              onValueChange={setSearch}
              className="h-11"
            />
          </div>

          <CommandList className="max-h-72">
            {filteredProducts.length === 0 ? (
              <CommandEmpty>{emptyText}</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredProducts.map((product) => {
                  const isSelected =
                    product.sku.trim().toLowerCase() === value.trim().toLowerCase();

                  return (
                    <CommandItem
                      key={product.sku}
                      value={`${product.sku} ${product.name}`}
                      onSelect={() => {
                        onChange(product.sku);
                        setOpen(false);
                        setSearch("");
                      }}
                      className="flex items-start justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{product.sku}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {product.name}
                        </p>
                      </div>

                      <Check
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}