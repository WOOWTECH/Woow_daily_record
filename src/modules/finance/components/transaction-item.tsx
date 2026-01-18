// src/modules/finance/components/transaction-item.tsx
"use client";

import Icon from "@mdi/react";
import { mdiTrendingUp, mdiTrendingDown, mdiBankTransfer } from "@mdi/js";
import { FinanceTransaction, FinanceCategory } from "../types";

interface TransactionItemProps {
  transaction: FinanceTransaction;
  categories?: FinanceCategory[];
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-TW", {
    month: "short",
    day: "numeric",
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: 0,
  }).format(amount);
};

export function TransactionItem({ transaction, categories }: TransactionItemProps) {
  // Determine icon and colors based on transaction type
  const getIconConfig = () => {
    switch (transaction.type) {
      case "income":
        return {
          path: mdiTrendingUp,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
        };
      case "expense":
        return {
          path: mdiTrendingDown,
          color: "text-red-500",
          bgColor: "bg-red-500/10",
        };
      case "transfer":
        return {
          path: mdiBankTransfer,
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
        };
      default:
        return {
          path: mdiTrendingDown,
          color: "text-red-500",
          bgColor: "bg-red-500/10",
        };
    }
  };

  // Get category name - first try joined field, then lookup from categories array
  const getCategoryName = () => {
    // Try joined category field first
    if (transaction.category?.name) {
      return transaction.category.name;
    }

    // Try to find in categories array
    if (categories && transaction.category_id) {
      const category = categories.find((c) => c.id === transaction.category_id);
      if (category) {
        return category.name;
      }
    }

    // Fall back to description or type label
    if (transaction.description) {
      return transaction.description;
    }

    // Type label as last fallback
    const typeLabels: Record<string, string> = {
      income: "Income",
      expense: "Expense",
      transfer: "Transfer",
    };
    return typeLabels[transaction.type] || transaction.type;
  };

  // Get account name from joined field
  const getAccountName = () => {
    return transaction.account?.name || "";
  };

  // Format amount with prefix based on type
  const getFormattedAmount = () => {
    const amount = formatCurrency(transaction.amount);
    switch (transaction.type) {
      case "income":
        return `+${amount}`;
      case "expense":
        return `-${amount}`;
      case "transfer":
      default:
        return amount;
    }
  };

  // Get amount text color based on type
  const getAmountColor = () => {
    switch (transaction.type) {
      case "income":
        return "text-green-500";
      case "expense":
        return "text-red-500";
      case "transfer":
      default:
        return "text-brand-black dark:text-brand-white";
    }
  };

  const iconConfig = getIconConfig();
  const categoryName = getCategoryName();
  const accountName = getAccountName();
  const formattedDate = formatDate(transaction.date);
  const formattedAmount = getFormattedAmount();
  const amountColor = getAmountColor();

  return (
    <div className="flex items-center gap-4 p-4">
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconConfig.bgColor}`}
      >
        <Icon path={iconConfig.path} size={0.9} className={iconConfig.color} />
      </div>

      {/* Primary and Secondary Text */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-brand-black dark:text-brand-white truncate">
          {categoryName}
        </p>
        <p className="text-sm text-brand-deep-gray truncate">
          {accountName}
          {accountName && " \u00B7 "}
          {formattedDate}
        </p>
      </div>

      {/* Amount */}
      <div className={`text-right flex-shrink-0 font-bold ${amountColor}`}>
        {formattedAmount}
      </div>
    </div>
  );
}
