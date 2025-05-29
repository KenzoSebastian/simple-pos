import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const productRouter = createTRPCRouter({
  getProducts: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;
    const products = await db.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return products;
  }),
  createProduct: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        price: z.number().min(0),
        categoryId: z.string(),
        imageUrl: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => { }),
  
  createProductImageUploadSignedUrl: protectedProcedure.mutation(async ({ ctx }) => {}),
});
