'use client';

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { PieChart, Pie, ResponsiveContainer, Cell, Legend } from "recharts";

export default function PortfolioPage() {
  const { user } = useUser();
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-4xl font-bold mb-4">Portfolio Tracking</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mb-8">
          Please log in to track your crypto portfolio
        </p>
      </div>
    );
  }

  // Sample data - will be replaced with real data from API
  const portfolioValue = 15234.56;
  const dailyChange = 523.45;
  const dailyChangePercentage = 3.55;
  const pieData = [
    { name: "Bitcoin", value: 8000 },
    { name: "Ethereum", value: 5000 },
    { name: "Dogecoin", value: 2234.56 },
  ];
  const transactions = [
    {
      id: 1,
      coin: "Bitcoin",
      type: "buy",
      quantity: 0.25,
      price: 32000,
      total: 8000,
      date: "2024-01-01",
    },
    {
      id: 2,
      coin: "Ethereum",
      type: "buy",
      quantity: 2.5,
      price: 2000,
      total: 5000,
      date: "2024-01-01",
    },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Your Portfolio</h1>
        <Dialog open={isAddingTransaction} onOpenChange={setIsAddingTransaction}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Transaction</DialogTitle>
            </DialogHeader>
            {/* Transaction form will be added here */}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${portfolioValue.toLocaleString()}</div>
            <div className={`text-sm mt-2 ${dailyChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {dailyChange >= 0 ? '+' : ''}{dailyChange.toLocaleString()} ({dailyChangePercentage}%)
              <span className="text-muted-foreground ml-1">24h</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Composition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Coin</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.date}</TableCell>
                    <TableCell className="capitalize">{tx.type}</TableCell>
                    <TableCell>{tx.coin}</TableCell>
                    <TableCell>{tx.quantity}</TableCell>
                    <TableCell className="text-right">${tx.total.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
