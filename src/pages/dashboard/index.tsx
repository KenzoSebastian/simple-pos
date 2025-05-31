import {
  DashboardDescription,
  DashboardHeader,
  DashboardLayout,
  DashboardTitle,
} from "@/components/layouts/DashboardLayout";
import { CategoryFilterCard } from "@/components/shared/category/CategoryFilterCard";
import { CreateOrderSheet } from "@/components/shared/CreateOrderSheet";
import { ProductMenuCard } from "@/components/shared/product/ProductMenuCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/data/mock";
import { useCartStore } from "@/store/cart";
import { api } from "@/utils/api";
import { Search, ShoppingCart } from "lucide-react";
import type { ReactElement } from "react";
import { useState } from "react";
import type { NextPageWithLayout } from "../_app";

const DashboardPage: NextPageWithLayout = () => {
  console.log("DashboardPage rendered");
  const cartStore = useCartStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [orderSheetOpen, setOrderSheetOpen] = useState(false);
  const { data: products, isLoading: productsIsLoading } =
    api.product.getProducts.useQuery();

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleAddToCart = (productId: string) => {
    const productToAdd = products?.find((product) => product.id === productId);
    if (!productToAdd) {
      alert("Product not found");
      return;
    }

    cartStore.addToCart({
      name: productToAdd.name,
      productId: productToAdd.id,
      imageUrl: productToAdd.imageUrl ?? "https://placehold.co/600x400",
      price: productToAdd.price,
    });
  };

  return (
    <>
      <DashboardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <DashboardTitle>Dashboard {cartStore.items.length}</DashboardTitle>
            <DashboardDescription>
              Welcome to your Simple POS system dashboard.
            </DashboardDescription>
          </div>

          {!!cartStore.items.length && (
            <Button
              className="animate-in slide-in-from-right"
              onClick={() => setOrderSheetOpen(true)}
            >
              <ShoppingCart /> Cart
            </Button>
          )}
        </div>
      </DashboardHeader>

      <div className="space-y-6">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-2">
          {CATEGORIES.map((category) => (
            <CategoryFilterCard
              key={category.id}
              name={category.name}
              productCount={category.count}
              isSelected={selectedCategory === category.id}
              onClick={() => handleCategoryClick(category.id)}
            />
          ))}
        </div>

        <div>
          {productsIsLoading ? (
            <div className="text-muted-foreground col-span-4 text-center">
              Loading...
            </div>
          ) : products?.length === 0 ? (
            <div className="text-muted-foreground col-span-4 text-center">
              No products found
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products?.map((product) => (
                <ProductMenuCard
                  key={product.id}
                  productId={product.id}
                  name={product.name}
                  price={product.price}
                  imageUrl={product.imageUrl ?? "https://placehold.co/600x400"}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateOrderSheet
        open={orderSheetOpen}
        onOpenChange={setOrderSheetOpen}
      />
    </>
  );
};

DashboardPage.getLayout = (page: ReactElement) => {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default DashboardPage;
