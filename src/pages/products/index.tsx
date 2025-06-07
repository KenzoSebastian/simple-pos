import {
  DashboardDescription,
  DashboardHeader,
  DashboardLayout,
  DashboardTitle,
} from "@/components/layouts/DashboardLayout";
import { ProductCatalogCard } from "@/components/shared/product/ProductCatalogCard";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";
import { useState, type ReactElement } from "react";
import type { NextPageWithLayout } from "../_app";
import { ProductForm } from "@/components/shared/product/ProductForm";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { productFormSchema, type ProductFormSchema } from "@/forms/product";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const ProductsPage: NextPageWithLayout = () => {
  const apiUtils = api.useUtils();

  const [uploadedProductImageUrl, setUploadedProductImageUrl] = useState<
    string | null
  >(null);
  const [createProductDialogOpen, setCreateProductDialogOpen] =
    useState<boolean>(false);

  const { data: products, isLoading: productsIsLoading } =
    api.product.getProducts.useQuery({
      categoryId: "all",
    });

  const { mutate: createProduct } = api.product.createProduct.useMutation({
    onSuccess: async () => {
      await apiUtils.product.getProducts.invalidate();
      setCreateProductDialogOpen(false);
      setUploadedProductImageUrl(null);
      toast("Product created successfully!");
    },
  });

  const createProductForm = useForm<ProductFormSchema>({
    resolver: zodResolver(productFormSchema),
  });

  const handleSubmitCreateProduct = (values: ProductFormSchema) => {
    if (!uploadedProductImageUrl) {
      toast("Please upload a product image first");
      return;
    }
    createProduct({
      name: values.name,
      price: values.price,
      categoryId: values.categoryId,
      imageUrl: uploadedProductImageUrl,
    });
    createProductForm.reset();
  };

  return (
    <>
      <DashboardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <DashboardTitle>Product Management</DashboardTitle>
            <DashboardDescription>
              View, add, edit, and delete products in your inventory.
            </DashboardDescription>
          </div>
          <AlertDialog
            open={createProductDialogOpen}
            onOpenChange={setCreateProductDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button>Add New Product</Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Add Product</AlertDialogTitle>
              </AlertDialogHeader>

              <Form {...createProductForm}>
                <ProductForm
                  onSubmit={handleSubmitCreateProduct}
                  onChangeImageUrl={(imageUrl) =>
                    setUploadedProductImageUrl(imageUrl)
                  }
                />
              </Form>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  onClick={createProductForm.handleSubmit(
                    handleSubmitCreateProduct,
                  )}
                >
                  Create Product
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {productsIsLoading ? (
          <div className="text-muted-foreground col-span-4 text-center">
            Loading...
          </div>
        ) : products?.length === 0 ? (
          <div className="text-muted-foreground col-span-4 text-center">
            No products found. Please add a new product to get started.
          </div>
        ) : (
          products?.map((product) => {
            return (
              <ProductCatalogCard
                key={product.id}
                name={product.name}
                price={product.price}
                image={product.imageUrl ?? ""}
                category={product.category.name}
              />
            );
          })
        )}
      </div>
    </>
  );
};

ProductsPage.getLayout = (page: ReactElement) => {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default ProductsPage;
