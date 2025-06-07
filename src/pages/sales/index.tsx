import {
  DashboardDescription,
  DashboardHeader,
  DashboardLayout,
  DashboardTitle,
} from "@/components/layouts/DashboardLayout";
import { OrderCard } from "@/components/OrderCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/utils/api";
import { OrderStatus } from "@prisma/client";
import type { ReactElement } from "react";
import { useState } from "react";
import type { NextPageWithLayout } from "../_app";
import { toRupiah } from "@/utils/toRupiah";
import { toast } from "sonner";

const SalesPage: NextPageWithLayout = () => {
  const apiUtils = api.useUtils();

  const [filterOrder, setFilterOrder] = useState<OrderStatus | "ALL">("ALL");

  const { data: orders } = api.order.getOrders.useQuery({
    status: filterOrder, //ketika status diubah, maka data auto di fetch kembali
  });

  const {data: salesReport} = api.order.getSalesReport.useQuery();

  const { mutate: finishOrder, isPending: finishOrderIsPending, variables: finishOrderVariables } =
    api.order.finishOrder.useMutation({
      onSuccess: async () => {
        await apiUtils.order.getOrders.invalidate();
        toast("Order finished successfully!");
      },
    });

  const handleFinishOrder = (orderId: string) => {
    finishOrder({
      orderId,
    });
  };

  const handleFilterOrderChange = (value: OrderStatus | "ALL") => {
    setFilterOrder(value);
  };

  return (
    <>
      <DashboardHeader>
        <DashboardTitle>Sales Dashboard</DashboardTitle>
        <DashboardDescription>
          Track your sales performance and view analytics.
        </DashboardDescription>
      </DashboardHeader>

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-4 shadow-sm">
          <h3 className="text-lg font-medium">Total Revenue</h3>
          <p className="mt-2 text-3xl font-bold">{toRupiah(salesReport?.totalRevenue ?? 0)}</p>
        </div>

        <div className="rounded-lg border p-4 shadow-sm">
          <h3 className="text-lg font-medium">Ongoing Orders</h3>
          <p className="mt-2 text-3xl font-bold">{salesReport?.totalOnGoingOrders ?? 0}</p>
        </div>

        <div className="rounded-lg border p-4 shadow-sm">
          <h3 className="text-lg font-medium">Completed Orders</h3>
          <p className="mt-2 text-3xl font-bold">{salesReport?.totalCompletedOrders ?? 0}</p>
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <div className="flex justify-between">
          <h3 className="mb-4 text-lg font-medium">Orders</h3>

          <Select defaultValue="ALL" onValueChange={handleFilterOrderChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="ALL">ALL</SelectItem>
              {Object.keys(OrderStatus).map((orderStatus) => (
                <SelectItem key={orderStatus} value={orderStatus}>
                  {`${orderStatus}`.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders?.map((order) => (
            <OrderCard
              key={order.id}
              id={order.id}
              totalAmount={order.grandTotal}
              totalItems={order._count.orderItems}
              status={order.status}
              onFinishOrder={handleFinishOrder}
              isFinishingOrder={finishOrderIsPending && finishOrderVariables?.orderId === order.id}
            />
          ))}
        </div>
      </div>
    </>
  );
};

SalesPage.getLayout = (page: ReactElement) => {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default SalesPage;
