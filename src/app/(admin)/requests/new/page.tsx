"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Package, Mail, Search, List, User } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import useDebounce from "@/lib/utils/useDebounce";
import { submitRequestAction } from "@/actions/request/action";
import { toast } from "sonner";

interface BaseItem {
  justification: string;
}

interface SoftwareItem extends BaseItem {
  type: "OTHER" | "LICENSE";
  licenseId?: string;
  licenseName?: string;
  vendor?: string;
  handler?: string;
}

type RequestItem = SoftwareItem;

export default function NewRequestPage() {
  const [requestItems, setRequestItems] = useState<RequestItem[]>([]);
  const [activeTab, setActiveTab] = useState("existing");
  const [isLoading, setIsLoading] = useState(false);
  // Form states
  const [formData, setFormData] = useState({
    license: "",
    justification: "",
    softwareName: "",
    softwareVendor: "",
    fullname: "",
    department: "",
    position: "",
    role: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [requestedFor, setRequestedFor] = useState<"self" | "other">("self");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");

  const debouncedSearch = useDebounce(employeeSearch, 500);

  // EMPLOYEE AND LICENSES DROPDOWN SECTION
  const { data: employees } = useSWR(
    `/api/user-management/drop-downs?search=${debouncedSearch}`,
    fetcher
  );

  const { data: licenses, isLoading: loadingLicenses } = useSWR(
    "/api/license-management/drop-downs",
    fetcher
  );

  const filteredLicenses = licenses?.filter(
    (license) =>
      license.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.vendor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // FORMDATA UPDATE HELPER FUNCTION
  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = (fields: string[]) => {
    const resetData = fields.reduce(
      (acc, field) => ({
        ...acc,
        [field]: "",
      }),
      {}
    );
    setFormData((prev) => ({ ...prev, ...resetData }));
  };

  const addItem = (item: RequestItem) => {
    if (requestItems.length === 3) {
      toast.error("Maximum of 3 items only per request.");
      return;
    }
    setRequestItems((prev) => [...prev, item]);
  };

  const removeItem = (index: number) => {
    setRequestItems((prev) => prev.filter((_, i) => i !== index));
  };

  // ADD EXISITING SOFTWARE HANDLER
  const addExistingSoftware = () => {
    if (!formData.license || !formData.justification) return;

    const license = licenses?.find((l) => l.id === formData.license);
    if (!license) return;

    addItem({
      type: "LICENSE",
      licenseId: license.id,
      justification: formData.justification,
      licenseName: license.name,
      vendor: license.vendor,
    });

    resetForm(["license", "justification"]);
    setSearchTerm("");
  };

  // ADD EXISITING SOFTWARE HANDLER
  const addNewSoftware = () => {
    if (!formData.softwareName || !formData.justification) return;

    addItem({
      type: "OTHER",
      licenseName: formData.softwareName,
      vendor: formData.softwareVendor,
      justification: formData.justification,
    });

    resetForm(["softwareName", "softwareVendor", "justification"]);
  };

  // REQUEST SUBMISSION HANDLER
  const submitRequest = async () => {
    if (requestItems.length === 0) return;

    setIsLoading(true);
    const requestData = {
      requestItems: requestItems,
      requestedFor: requestedFor === "other" ? selectedEmployee : null,
    };

    try {
      const response = await submitRequestAction({
        requestItems: requestData.requestItems,
        requestedFor: requestData.requestedFor,
      }).finally(() => {
        setIsLoading(false);
      });
      if (response.error || !response.success) {
        toast.error(response.error);
      } else {
        toast.success(response.warnings || "Request created successfully");
        setRequestItems([]);
        setSelectedEmployee("");
        setRequestedFor("self");
      }
    } catch (error) {
      console.error("Failed to submit request:", error);
    }
  };

  // COMPUTED NUMBERS
  const softwareItems = requestItems.filter(
    (item): item is SoftwareItem =>
      item.type === "LICENSE" || item.type === "OTHER"
  );

  const canSubmit =
    requestItems.length > 0 && (requestedFor === "self" || selectedEmployee);

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">New Request</h1>
          <p className="text-muted-foreground">Request software licenses</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request Items Sidebar */}
          <Sidebar
            items={requestItems}
            requestedFor={requestedFor}
            selectedEmployee={selectedEmployee}
            employeeSearch={employeeSearch}
            employees={employees}
            onRemoveItem={removeItem}
            onRequestedForChange={setRequestedFor}
            onEmployeeSelect={setSelectedEmployee}
            onEmployeeSearchChange={setEmployeeSearch}
            onSubmit={submitRequest}
            canSubmit={canSubmit}
            isLoading={isLoading}
            softwareCount={softwareItems.length}
          />

          {/* Request Forms */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Add Request Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="existing">
                      <Package className="h-4 w-4 mr-2" />
                      Existing Software
                    </TabsTrigger>
                    <TabsTrigger value="other">
                      <Plus className="h-4 w-4 mr-2" />
                      Other Software
                    </TabsTrigger>
                  </TabsList>

                  <ExistingSoftwareTab
                    licenses={filteredLicenses}
                    loading={loadingLicenses}
                    searchTerm={searchTerm}
                    formData={formData}
                    onSearchChange={setSearchTerm}
                    onFormChange={updateFormData}
                    onSubmit={addExistingSoftware}
                  />

                  <OtherSoftwareTab
                    formData={formData}
                    onFormChange={updateFormData}
                    onSubmit={addNewSoftware}
                  />
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sidebar Component
const Sidebar = ({
  items,
  requestedFor,
  selectedEmployee,
  employeeSearch,
  employees,
  onRemoveItem,
  onRequestedForChange,
  onEmployeeSelect,
  onEmployeeSearchChange,
  onSubmit,
  canSubmit,
  isLoading,
  softwareCount,
}) => (
  <div className="lg:col-span-1">
    <Card className="h-fit sticky top-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-5 w-5" />
          Request Items ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No items added yet</p>
            <p className="text-sm">Add items from the tabs</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {items.map((item, index) => (
                <RequestItemCard
                  key={index}
                  item={item}
                  onRemove={() => onRemoveItem(index)}
                />
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <RequestedForSection
                requestedFor={requestedFor}
                selectedEmployee={selectedEmployee}
                employeeSearch={employeeSearch}
                employees={employees}
                onRequestedForChange={onRequestedForChange}
                onEmployeeSelect={onEmployeeSelect}
                onEmployeeSearchChange={onEmployeeSearchChange}
              />

              <SummarySection
                softwareCount={softwareCount}
                totalCount={items.length}
              />

              <Button
                onClick={onSubmit}
                disabled={!canSubmit || isLoading}
                className="w-full mt-4"
                size="lg"
              >
                {isLoading ? "Submitting..." : "Submit Request"}
              </Button>

              {requestedFor === "other" && !selectedEmployee && (
                <p className="text-xs text-amber-600 text-center mt-2">
                  Please select an employee to submit the request
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  </div>
);

// Individual Components
const RequestItemCard = ({ item, onRemove }) => (
  <div className="p-3 border rounded-lg hover:border-gray-300 transition-colors">
    <div className="flex items-start gap-3">
      {item.type === "LICENSE" || item.type === "OTHER" ? (
        <Package className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
      ) : (
        <Mail className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs">
            {item.type === "LICENSE" ? item.vendor : item.vendor}
          </Badge>
          {item.vendor && (
            <span className="text-xs text-muted-foreground">
              {item.licenseName}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {item.justification}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-6 w-6 p-0 flex-shrink-0"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  </div>
);

const RequestedForSection = ({
  requestedFor,
  selectedEmployee,
  employeeSearch,
  employees,
  onRequestedForChange,
  onEmployeeSelect,
  onEmployeeSearchChange,
}) => (
  <div className="space-y-3 mb-4">
    <Label className="text-sm font-medium">
      <User className="h-4 w-4 inline mr-1" />
      Requested For
    </Label>
    <div className="space-y-2">
      <Select value={requestedFor} onValueChange={onRequestedForChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select who this is for" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="self">Myself</SelectItem>
          <SelectItem value="other">Another Employee</SelectItem>
        </SelectContent>
      </Select>

      {requestedFor === "other" && (
        <div className="space-y-2 w-full">
          <Label className="text-xs">Select Employee</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              className="pl-9 text-sm h-9"
              value={employeeSearch}
              onChange={(e) => onEmployeeSearchChange(e.target.value)}
            />
          </div>
          <div className="max-h-[120px] overflow-y-auto border rounded-md">
            {employees?.slice(0, 10).map((employee) => (
              <div
                key={employee.id}
                className={`p-2 text-sm cursor-pointer hover:bg-muted ${
                  selectedEmployee === employee.id ? "bg-muted" : ""
                }`}
                onClick={() => onEmployeeSelect(employee.id)}
              >
                <div className="font-medium">{employee.name}</div>
                <div className="text-xs text-muted-foreground">
                  {employee.department} • {employee.email}
                </div>
              </div>
            ))}
            {employees?.length === 0 && (
              <div className="p-2 text-sm text-muted-foreground text-center">
                No employees found
              </div>
            )}
          </div>
          {selectedEmployee && (
            <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
              <span className="font-medium">Selected: </span>
              {employees?.find((e) => e.id === selectedEmployee)?.name}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

const SummarySection = ({ softwareCount, totalCount }) => (
  <div className="space-y-2 text-sm">
    <div className="flex justify-between">
      <span className="text-muted-foreground">Total:</span>
      <span>{totalCount}</span>
    </div>
  </div>
);

// Tab Components
const ExistingSoftwareTab = ({
  licenses,
  loading,
  searchTerm,
  formData,
  onSearchChange,
  onFormChange,
  onSubmit,
}) => (
  <TabsContent value="existing" className="space-y-4 mt-6">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Search Software</Label>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search available software..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="w-full">
        <Label>Select Software</Label>
        <Select
          disabled={loading}
          value={formData.license}
          onValueChange={(value) => onFormChange("license", value)}
        >
          <SelectTrigger className="w-full mt-3">
            <SelectValue
              placeholder={loading ? "Loading..." : "Choose software..."}
            />
          </SelectTrigger>
          <SelectContent>
            {licenses?.map((license) => (
              <SelectItem key={license.id} value={license.id}>
                <div className="flex items-center justify-between w-full">
                  <div className="font-medium">
                    {license.name}{" "}
                    <span className="text-muted-foreground">
                      ({license.vendor} - {license.owner})
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {license.availableSeats} seats
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>

    <JustificationField
      value={formData.justification}
      onChange={(value) => onFormChange("justification", value)}
      placeholder="Explain why this license is needed..."
    />

    <Button
      onClick={onSubmit}
      disabled={!formData.license || !formData.justification}
      className="w-full"
    >
      <Plus className="h-4 w-4 mr-2" />
      Add Software to Request
    </Button>
  </TabsContent>
);

const OtherSoftwareTab = ({ formData, onFormChange, onSubmit }) => (
  <TabsContent value="other" className="space-y-4 mt-6">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Software Name *</Label>
        <Input
          className="mt-3"
          value={formData.softwareName}
          onChange={(e) => onFormChange("softwareName", e.target.value)}
          placeholder="e.g., VSCode, Figma"
        />
      </div>
      <div>
        <Label>Vendor</Label>
        <Input
          className="mt-3"
          value={formData.softwareVendor}
          onChange={(e) => onFormChange("softwareVendor", e.target.value)}
          placeholder="e.g., Microsoft, Adobe"
        />
      </div>
    </div>

    <JustificationField
      value={formData.justification}
      onChange={(value) => onFormChange("justification", value)}
      placeholder="Why do you need this software? What will you use it for?"
    />

    <Button
      onClick={onSubmit}
      disabled={!formData.softwareName || !formData.justification}
      className="w-full"
    >
      <Plus className="h-4 w-4 mr-2" />
      Request New Software
    </Button>
  </TabsContent>
);

const JustificationField = ({ value, onChange, placeholder }) => (
  <div>
    <Label>Business Justification *</Label>
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="min-h-[100px] mt-2"
    />
  </div>
);
