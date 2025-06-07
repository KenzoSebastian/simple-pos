import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

// query => fetching data
// mutation => create, update, delete data

export const categoryRouter = createTRPCRouter({
  getCategories: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;

    const categories = await db.category.findMany({
      select: {
        id: true,
        name: true,
        productcount: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return categories;
  }),

  createCategory: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3, "minimum of 3 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      const newCategory = await db.category.create({
        data: {
          name: input.name,
        },
        select: {
          id: true,
          name: true,
          productcount: true,
        },
      });

      return newCategory;
    }),

  deleteCategoryById: protectedProcedure
    .input(
      z.object({
        categoryId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      await db.category.delete({
        where: {
          id: input.categoryId,
        },
      });
    }),

  editCategoryById: protectedProcedure
    .input(
      z.object({
        categoryId: z.string(),
        name: z.string().min(3, "minimum of 3 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      await db.category.update({
        where: {
          id: input.categoryId,
        },
        data: {
          name: input.name,
        },
      });
    }),
});
