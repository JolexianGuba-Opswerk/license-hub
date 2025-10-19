"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import { PinIcon } from "lucide-react";

import { useSearchParams } from "next/navigation";
import { createProcurementAction } from "@/actions/procurement/action";
import { createClient } from "@/lib/supabase/supabase-client";
import ForbiddenAccessPage from "@/components/ForbiddenAccessPage";

export default function NewProcurementRequest() {
  const searchParams = useSearchParams();
  const requestItemId = searchParams.get("requestItemId");
  const requestItemName = searchParams.get("name");
  const requestedVendor = searchParams.get("vendor");
  const justification = searchParams.get("justification");
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [form, setForm] = useState({
    name: requestItemName,
    vendor: requestedVendor,
    vendorEmail: "",
    price: "",
    quantity: 1,
    currency: "PHP",
    cc: "ITSG",
    notes: "",
    itemDescription: "",
    requestItemId: requestItemId || null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [totalCost, setTotalCost] = useState(0);

  // Auto calculate total cost
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Check if user is authorized
      if (
        !user ||
        !["MANAGER", "TEAM_LEAD"].includes(user.user_metadata.role) ||
        !["ITSG", "FINANCE"].includes(user.user_metadata.department)
      ) {
        setAuthorized(false);
      } else {
        setAuthorized(true);
      }
    };

    checkUser();

    const cost = Number(form.price || 0) * Number(form.quantity || 1);
    setTotalCost(cost);
  }, [form.price, form.quantity]);

  if (!authorized && authorized !== null) {
    return <ForbiddenAccessPage />;
  }

  const handleSubmit = async () => {
    if (!isFormValid) {
      toast.error("Please fill all required fields marked with *");
      return;
    }
    setIsLoading(true);
    try {
      const res = await createProcurementAction(form);
      if (!res.success) {
        return toast.error(res.error || "Something went wrong in saving");
      }
      toast.success("Procurement request submitted successfully!");

      // Reset form after successful submission
      setForm({
        name: "",
        vendor: "",
        vendorEmail: "",
        price: "",
        quantity: 1,
        currency: "PHP",
        cc: "ITSG",
        notes: "",
        itemDescription: "",
        requestItemId,
      });
      setTotalCost(0);
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit procurement request.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    form.name && form.itemDescription && form.price && form.vendor;

  return (
    <div className="container mx-auto py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 lg:p-10">
      {/* Main Form */}
      <div className="lg:col-span-2">
        <Card className="shadow-lg border-0">
          {/* Indication Banner */}
          {requestItemId && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3 text-blue-800 mx-6 mt-3">
              <PinIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm">Linked Request</p>
                <p className="text-sm text-blue-700">
                  This procurement request is associated with request:{" "}
                  <span className="font-semibold">#{requestItemId}</span>
                </p>
              </div>
            </div>
          )}

          <CardHeader className="pb-2 px-6">
            <CardTitle className="text-2xl font-bold text-gray-900">
              New Procurement Request
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Fill in the details below to create a new procurement request
            </p>
          </CardHeader>

          <CardContent className="space-y-8 px-6 pb-6">
            {/* Item Information */}
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  Item Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="itemName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Item / Software Name *
                  </Label>
                  <Input
                    id="itemName"
                    value={form.name as string}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Adobe Photoshop, Microsoft Office"
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="quantity"
                    className="text-sm font-medium text-gray-700"
                  >
                    Quantity
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: Number(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium text-gray-700"
                >
                  Item Description *
                </Label>
                <Input
                  id="justification"
                  value={form.itemDescription}
                  onChange={(e) =>
                    setForm({ ...form, itemDescription: e.target.value })
                  }
                  placeholder="Please provide item description."
                  className=""
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="justification"
                  className="text-sm font-medium text-gray-700 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <PinIcon className="h-4 w-4 text-amber-500" />
                    License Request Justification *
                  </span>
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                    license request
                  </span>
                </Label>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm">
                  <Textarea
                    id="justification"
                    value={justification as string}
                    disabled={true}
                    placeholder="Explain why this procurement is needed, including business case and benefits..."
                    className="min-h-[80px] resize-vertical bg-white border-amber-300"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label
                  htmlFor="notes"
                  className="text-sm font-medium text-gray-700"
                >
                  Additional Notes *
                </Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Explain why this procurement is needed, including business case and benefits..."
                  className="min-h-[100px] resize-vertical"
                />
              </div>
            </section>

            {/* Vendor Information */}
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  Vendor Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="vendor"
                    className="text-sm font-medium text-gray-700"
                  >
                    Vendor Name *
                  </Label>
                  <Input
                    id="vendor"
                    value={form.vendor as string}
                    onChange={(e) =>
                      setForm({ ...form, vendor: e.target.value })
                    }
                    placeholder="e.g., Adobe Inc., Microsoft Corporation"
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="vendorEmail"
                    className="text-sm font-medium text-gray-700"
                  >
                    Vendor Email
                  </Label>
                  <Input
                    id="vendorEmail"
                    type="email"
                    value={form.vendorEmail}
                    onChange={(e) =>
                      setForm({ ...form, vendorEmail: e.target.value })
                    }
                    placeholder="vendor@company.com"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="price"
                    className="text-sm font-medium text-gray-700"
                  >
                    Price per Unit
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    placeholder="0.00"
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="currency"
                    className="text-sm font-medium text-gray-700"
                  >
                    Currency
                  </Label>
                  <Select
                    value={form.currency}
                    onValueChange={(v) => setForm({ ...form, currency: v })}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PHP">PHP (₱)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Total Cost
                  </Label>
                  <div className="flex items-center h-10 px-3 border border-gray-200 rounded-md bg-gray-50 text-gray-900 font-medium">
                    {form.currency}{" "}
                    {totalCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* Department & Delivery */}
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  Department & Delivery
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 w-full">
                  <Label
                    htmlFor="department"
                    className="text-sm font-medium text-gray-700"
                  >
                    Charge to Department
                  </Label>
                  <Select
                    value={form.cc}
                    onValueChange={(v) => setForm({ ...form, cc: v })}
                  >
                    <SelectTrigger id="department" className="w-full">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ITSG">ITSG</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="FINANCE">Finance</SelectItem>
                      <SelectItem value="SRE">SRE</SelectItem>
                      <SelectItem value="SSED">SSED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar Summary - Updated for single item */}
      <div className="space-y-6">
        <Card className="shadow-lg border-0 sticky top-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-gray-900">
              Request Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Item Preview */}
            {form.name && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 text-sm">
                  Item Preview
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Item:</span>
                    <span className="font-medium text-gray-900">
                      {form.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vendor:</span>
                    <span className="font-medium text-gray-900">
                      {form.vendor || "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium text-gray-900">
                      {form.quantity}
                    </span>
                  </div>
                  {form.price && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Cost:</span>
                      <span className="font-medium text-gray-900">
                        {form.currency}{" "}
                        {totalCost.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Requirements Status */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 text-sm">
                Requirements
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      form.name ? "bg-green-500" : "bg-gray-300"
                    }`}
                  ></div>
                  <span
                    className={`text-sm ${
                      form.name ? "text-gray-700" : "text-gray-500"
                    }`}
                  >
                    Item Name {form.name ? "✓" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      form.itemDescription ? "bg-green-500" : "bg-gray-300"
                    }`}
                  ></div>
                  <span
                    className={`text-sm ${
                      form.itemDescription ? "text-gray-700" : "text-gray-500"
                    }`}
                  >
                    Item Description {form.itemDescription ? "✓" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      form.vendor ? "bg-green-500" : "bg-gray-300"
                    }`}
                  ></div>
                  <span
                    className={`text-sm ${
                      form.vendor ? "text-gray-700" : "text-gray-500"
                    }`}
                  >
                    Vendor Name {form.vendor ? "✓" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      form.price ? "bg-green-500" : "bg-gray-300"
                    }`}
                  ></div>
                  <span
                    className={`text-sm ${
                      form.price ? "text-gray-700" : "text-gray-500"
                    }`}
                  >
                    Price {form.price ? "✓" : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 transition-colors duration-200"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </div>
              ) : (
                "Submit Procurement Request"
              )}
            </Button>

            {!isFormValid && (
              <p className="text-xs text-gray-500 text-center">
                Please fill all required fields (*) to submit
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
