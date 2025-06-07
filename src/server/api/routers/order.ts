import { createQRIS, xenditPaymentMethodClient } from "@/server/xendit";
import { TRPCError } from "@trpc/server";
import { object, z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { OrderStatus, type Prisma } from "@prisma/client";

export const orderRouter = createTRPCRouter({
  createOrder: protectedProcedure
    .input(
      z.object({
        orderItems: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number().min(1),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const { orderItems } = input;

      // data real/update dari db, dari product yang ada di orderItems
      const products = await db.product.findMany({
        where: {
          id: {
            in: orderItems.map((item) => item.productId),
          },
        },
      });

      let subtotal = 0;
      products.forEach((product) => {
        const productQuantity = orderItems.find(
          (item) => item.productId === product.id,
        )!.quantity;

        const totalPrice = product.price * productQuantity;
        subtotal += totalPrice;
      });

      const tax = subtotal * 0.1;
      const grandTotal = subtotal + tax;

      const order = await db.order.create({
        data: {
          grandTotal,
          subtotal,
          tax,
        },
      });

      const newOrderItems = await db.orderItem.createMany({
        data: products.map((product) => {
          const productQuantity = orderItems.find(
            (item) => item.productId === product.id,
          )!.quantity;

          return {
            orderId: order.id,
            price: product.price,
            productId: product.id,
            quantity: productQuantity,
          };
        }),
      });

      const paymentRequest = await createQRIS({
        amount: grandTotal,
        orderId: order.id,
      });

      await db.order.update({
        where: { id: order.id },
        data: {
          externalTransactionId: paymentRequest.id,
          paymentMethodId: paymentRequest.paymentMethod.id,
        },
      });

      const qrString =
        paymentRequest.paymentMethod.qrCode!.channelProperties!.qrString!;

      return { order, newOrderItems, qrString };
    }),

  simulatePayment: protectedProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      const order = await db.order.findUnique({
        where: { id: input.orderId },
        select: {
          paymentMethodId: true,
          grandTotal: true,
          externalTransactionId: true,
        },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      await xenditPaymentMethodClient.simulatePayment({
        paymentMethodId: order.paymentMethodId!,
        data: {
          amount: order.grandTotal,
        },
      });

      await db.order.update({
        where: { id: input.orderId },
        data: {
          status: "PROCCESSING",
          paidAt: new Date(),
        },
      });
    }),

  checkOrderPaymentStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      const order = await db.order.findUnique({
        where: { id: input.orderId },
        select: {
          status: true,
          paidAt: true,
        },
      });

      if (!order?.paidAt) return false;

      return true;
    }),

  getOrders: protectedProcedure
    .input(
      z.object({
        status: z.enum(["ALL", ...Object.keys(OrderStatus)] as [
          string,
          ...string[],
        ]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx;

      const whereClause: Prisma.OrderWhereInput = {};

      switch (input.status) {
        case OrderStatus.AWAITING_PAYMENT:
          whereClause.status = OrderStatus.AWAITING_PAYMENT;
          break;
        case OrderStatus.PROCCESSING:
          whereClause.status = OrderStatus.PROCCESSING;
          break;
        case OrderStatus.DONE:
          whereClause.status = OrderStatus.DONE;
          break;
      }
      console.log(input.status);

      const orders = await db.order.findMany({
        where: whereClause,
        select: {
          id: true,
          grandTotal: true,
          status: true,
          paidAt: true,
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      });

      return orders;
    }),

  finishOrder: protectedProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      const order = await db.order.findUnique({
        where: { id: input.orderId },
        select: {
          paidAt: true,
          status: true,
          id: true,
        },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      if (!order.paidAt) {
        throw new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
          message: "Order is not paid yet",
        });
      }

      if (order.status !== OrderStatus.PROCCESSING) {
        throw new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
          message: "Order is not processing yet",
        });
      }

      return await db.order.update({
        where: { id: input.orderId },
        data: {
          status: OrderStatus.DONE,
        },
      });
    }),

  getSalesReport: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;

    const paidOrdersQuery = db.order.findMany({
      where: {
        paidAt: {
          not: null,
        },
      },
      select: {
        grandTotal: true,
      },
    });

    const onGoingOrdersQuery = db.order.findMany({
      where: {
        status: {
          not: OrderStatus.DONE,
        },
      },
      select: {
        id: true,
      },
    });

    const completedOrdersQuery = db.order.findMany({
      where: {
        status: OrderStatus.DONE,
      },
      select: {
        id: true,
      },
    });

    const [paidOrders, onGoingOrders, completedOrders] = await Promise.all([
      paidOrdersQuery,
      onGoingOrdersQuery,
      completedOrdersQuery,
    ]);

    const totalRevenue = paidOrders.reduce((a, b) => a + b.grandTotal, 0);
    const totalOnGoingOrders = onGoingOrders.length;
    const totalCompletedOrders = completedOrders.length;

    return {
      totalRevenue,
      totalOnGoingOrders,
      totalCompletedOrders,
    };
  }),
});
