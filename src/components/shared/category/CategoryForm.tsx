import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type CategoryFormSchema } from "@/forms/category";
import { type UseFormReturn } from "react-hook-form";

interface CategoryFormProps {
  onSubmit: (data: CategoryFormSchema) => void;
  submitText: string;
  form: UseFormReturn<CategoryFormSchema>;
}

export const CategoryForm = ({
  onSubmit,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  submitText,
  form,
}: CategoryFormProps) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
