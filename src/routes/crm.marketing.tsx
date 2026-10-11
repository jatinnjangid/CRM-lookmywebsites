import { createFileRoute } from "@tanstack/react-router";
import { Plus, Mail, MessageCircle, Send, Search, Filter, Copy, Edit2, LayoutTemplate, MoreVertical, Trash2, MessageSquare, Download, ChevronDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/crm/marketing")({
  component: MarketingPage,
});

type Channel = "WhatsApp" | "Email" | "SMS";
type Category = "Featured" | "Domestic Tours" | "International Tours" | "Honeymoon" | "Family Packages" | "Travel Insurance" | "Visa Services" | "Hotel Booking" | "Festival Offers" | "Promotional Messages";

interface Template {
  id: string;
  name: string;
  category: Category;
  channel: Channel;
  lastUpdated: string;
  status: "Active" | "Draft";
  content: string;
}

import { useSupabaseTable } from "@/hooks/useSupabaseTable";

const CATEGORIES: Category[] = [
  "Featured", "Domestic Tours", "International Tours", "Honeymoon", 
  "Family Packages", "Travel Insurance", "Visa Services", "Hotel Booking", 
  "Festival Offers", "Promotional Messages"
];

function MarketingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "All">("All");
  const [selectedChannel, setSelectedChannel] = useState<Channel | "All">("All");
  const [selectedStatus, setSelectedStatus] = useState<"All" | "Active" | "Draft">("All");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignData, setCampaignData] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState<{name: string, category: string, channel: string, customCategory: string, customChannel: string, content: string, status: "Active" | "Draft"}>({
    name: "",
    category: "Featured",
    channel: "WhatsApp",
    customCategory: "",
    customChannel: "",
    content: "",
    status: "Active"
  });
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

  // Export State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  const [dbTemplates, setDbTemplates] = useSupabaseTable<any[]>("marketing_campaigns", []);

  const templates: Template[] = dbTemplates.map(c => ({
    id: c.id,
    name: c.name || "Unnamed Template",
    category: c.audience || "General",
    channel: c.type || "Other",
    lastUpdated: c.sentDate || "N/A",
    status: (c.status === "Active" || c.status === "Draft") ? c.status : "Active",
    content: c.description || ""
  }));

  const handleStatusChange = (templateId: string, newStatus: "Active" | "Draft") => {
    const todayFormatted = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setDbTemplates((prev: any) =>
      prev.map((t: any) =>
        t.id === templateId
          ? {
              ...t,
              status: newStatus,
              sentDate: todayFormatted
            }
          : t
      )
    );
    toast.success(`Template status updated to "${newStatus}"`);
  };

  const handleEditTemplate = (t: Template) => {
    setEditingTemplateId(t.id);
    setNewTemplate({
      name: t.name,
      category: CATEGORIES.includes(t.category as Category) ? t.category : "Other",
      channel: ["WhatsApp", "Email", "SMS"].includes(t.channel as Channel) ? t.channel : "Other",
      customCategory: !CATEGORIES.includes(t.category as Category) ? t.category : "",
      customChannel: !["WhatsApp", "Email", "SMS"].includes(t.channel as Channel) ? t.channel : "",
      content: t.content,
      status: t.status || "Active"
    });
    setPreviewTemplate(null);
    setIsCreateModalOpen(true);
  };

  const allChannels = Array.from(new Set(["WhatsApp", "Email", "SMS", ...templates.map(t => t.channel)]));

  const getChannelStyles = (channel: string) => {
    if (channel === "WhatsApp") return { bgLight: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-400", hover: "hover:text-emerald-600 dark:hover:text-emerald-400", border: "border-emerald-500/30", btnHover: "hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-300", icon: MessageCircle, title: "WhatsApp Templates" };
    if (channel === "Email") return { bgLight: "bg-blue-500/15", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-400", hover: "hover:text-blue-600 dark:hover:text-blue-400", border: "border-blue-500/30", btnHover: "hover:bg-blue-500/15 hover:text-blue-700 dark:hover:text-blue-300", icon: Mail, title: "Email Templates" };
    if (channel === "SMS") return { bgLight: "bg-violet-500/15", text: "text-violet-600 dark:text-violet-400", dot: "bg-violet-400", hover: "hover:text-violet-600 dark:hover:text-violet-400", border: "border-violet-500/30", btnHover: "hover:bg-violet-500/15 hover:text-violet-700 dark:hover:text-violet-300", icon: Send, title: "SMS Templates" };
    return { bgLight: "bg-secondary/50", text: "text-foreground", dot: "bg-muted-foreground", hover: "hover:text-foreground", border: "border-border", btnHover: "hover:bg-secondary hover:text-foreground", icon: MessageSquare, title: `${channel} Templates` };
  };

  const filteredTemplates = templates.filter(t => {
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedCategory !== "All" && t.category !== selectedCategory) return false;
    if (selectedChannel !== "All" && t.channel !== selectedChannel) return false;
    if (selectedStatus !== "All" && t.status !== selectedStatus) return false;
    return true;
  });

  const handleExportCSV = () => {
    const exportableTemplates = templates.filter(t => {
      const d = t.lastUpdated || "";
      const matchStart = exportStartDate && d ? d >= exportStartDate : true;
      const matchEnd = exportEndDate && d ? d <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    const csvRows = [
      ["ID", "Name", "Category", "Channel", "Last Updated", "Status", "Content"]
    ];

    exportableTemplates.forEach(t => {
      csvRows.push([
        `"${t.id}"`,
        `"${(t.name || "").replace(/"/g, '""')}"`,
        `"${t.category}"`,
        `"${t.channel}"`,
        `"${t.lastUpdated || ""}"`,
        `"${t.status}"`,
        `"${(t.content || "").replace(/"/g, '""')}"`
      ]);
    });

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `marketing_templates_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportOpen(false);
  };

  return (
    <div className="space-y-8 print:p-0 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <LayoutTemplate className="h-8 w-8 text-primary" /> Template Store
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and use marketing templates for your campaigns.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsExportOpen(true)} className="rounded-xl shadow-lg h-10 px-4">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button 
            onClick={() => {
              setEditingTemplateId(null);
              setNewTemplate({ name: "", category: "Featured", channel: "WhatsApp", customCategory: "", customChannel: "", content: "", status: "Active" });
              setIsCreateModalOpen(true);
            }}
            className="rounded-xl shadow-lg h-10 px-4"
          >
            <Plus className="h-4 w-4 mr-2" /> Create Template
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 gap-4 items-center flex-wrap w-full">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 pl-10 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-xl h-10 border-border bg-background hover:bg-secondary/40 text-foreground font-medium shadow-sm">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                Category: {selectedCategory}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px] max-h-[300px] overflow-y-auto rounded-xl">
              <DropdownMenuItem onClick={() => setSelectedCategory("All")} className="rounded-lg">
                All Categories
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {CATEGORIES.map(cat => (
                <DropdownMenuItem key={cat} onClick={() => setSelectedCategory(cat)} className="rounded-lg">
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-xl h-10 border-border bg-background hover:bg-secondary/40 text-foreground font-medium shadow-sm">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                Channel: {selectedChannel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1">
              <DropdownMenuItem onClick={() => setSelectedChannel("All")} className={`rounded-lg cursor-pointer ${selectedChannel === "All" ? "bg-cyan-50 text-cyan-600 font-medium" : ""}`}>All Channels</DropdownMenuItem>
              {allChannels.map(channel => (
                <DropdownMenuItem key={channel} onClick={() => setSelectedChannel(channel as any)} className={`rounded-lg cursor-pointer ${selectedChannel === channel ? "bg-cyan-50 text-cyan-600 font-medium" : ""}`}>
                  {channel}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-xl h-10 border-border bg-background hover:bg-secondary/40 text-foreground font-medium shadow-sm">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                Status: {selectedStatus}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 rounded-xl p-1">
              <DropdownMenuItem onClick={() => setSelectedStatus("All")} className={`rounded-lg cursor-pointer ${selectedStatus === "All" ? "bg-cyan-50 text-cyan-600 font-medium" : ""}`}>All Statuses</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus("Active")} className={`rounded-lg cursor-pointer ${selectedStatus === "Active" ? "bg-cyan-50 text-cyan-600 font-medium" : ""}`}>Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus("Draft")} className={`rounded-lg cursor-pointer ${selectedStatus === "Draft" ? "bg-cyan-50 text-cyan-600 font-medium" : ""}`}>Draft</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Grid Layout Categories */}
      {(selectedCategory === "All" && selectedChannel === "All" && !searchQuery) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {allChannels.map(channel => {
            const styles = getChannelStyles(channel);
            const Icon = styles.icon;
            const channelTemplates = templates.filter(t => t.channel === channel);

            return (
              <div key={channel} className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`h-10 w-10 rounded-full ${styles.bgLight} ${styles.text} flex items-center justify-center shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-display font-bold text-lg">{styles.title}</h2>
                </div>
                <div className="space-y-3 flex-1">
                  {channelTemplates.slice(0, 6).map(t => (
                    <div key={t.id} className={`flex items-center gap-2 text-sm font-medium text-foreground ${styles.hover} cursor-pointer transition-colors`} onClick={() => setPreviewTemplate(t)}>
                      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`}></span>
                      {t.name}
                    </div>
                  ))}
                  {channelTemplates.length === 0 && (
                    <div className="text-sm text-muted-foreground italic">No templates found.</div>
                  )}
                </div>
                <Button variant="outline" className={`w-full mt-6 rounded-xl bg-transparent ${styles.border} ${styles.text} ${styles.btnHover}`} onClick={() => setSelectedChannel(channel as any)}>
                  Browse {channel}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Table Section */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card mt-8">
        <div className="px-6 py-4 border-b border-border bg-secondary/20 flex justify-between items-center">
          <h2 className="font-semibold text-lg font-display text-foreground">All Templates</h2>
          <span className="text-xs text-muted-foreground bg-secondary/80 px-2.5 py-1 rounded-full font-medium">{filteredTemplates.length} results</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/30 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Template Name</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Category</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Channel</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Last Updated</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTemplates.map((template) => (
                <tr key={template.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-foreground">{template.name}</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{template.category}</td>
                  <td className="px-6 py-4">
                    {template.channel === "WhatsApp" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border dark:border-emerald-800/40 px-2.5 py-0.5 text-xs font-semibold">
                        <MessageCircle className="h-3 w-3" /> WhatsApp
                      </span>
                    )}
                    {template.channel === "Email" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 dark:border dark:border-blue-800/40 px-2.5 py-0.5 text-xs font-semibold">
                        <Mail className="h-3 w-3" /> Email
                      </span>
                    )}
                    {template.channel === "SMS" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300 dark:border dark:border-violet-800/40 px-2.5 py-0.5 text-xs font-semibold">
                        <Send className="h-3 w-3" /> SMS
                      </span>
                    )}
                    {template.channel !== "WhatsApp" && template.channel !== "Email" && template.channel !== "SMS" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary text-muted-foreground px-2.5 py-0.5 text-xs font-semibold">
                        <MessageSquare className="h-3 w-3" /> {template.channel || "Other"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{template.lastUpdated}</td>
                  <td className="px-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold cursor-pointer transition-all hover:scale-105 select-none ${
                            template.status === "Active"
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/40"
                              : "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border dark:border-amber-800/40"
                          }`}
                          title="Click to change status"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              template.status === "Active" ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          {template.status}
                          <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-32 rounded-xl p-1 shadow-lg">
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(template.id, "Active")}
                          className="flex items-center gap-2 text-xs font-medium cursor-pointer rounded-lg text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                        >
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          Active
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(template.id, "Draft")}
                          className="flex items-center gap-2 text-xs font-medium cursor-pointer rounded-lg text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/40"
                        >
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          Draft
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => setPreviewTemplate(template)} className="rounded-lg cursor-pointer">
                            <Copy className="mr-2 h-4 w-4" /> Use Template
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditTemplate(template)} className="rounded-lg cursor-pointer">
                            <Edit2 className="mr-2 h-4 w-4" /> Edit Template
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(template.id, template.status === "Active" ? "Draft" : "Active")} 
                            className="rounded-lg cursor-pointer"
                          >
                            <span className={`mr-2 h-2 w-2 rounded-full ${template.status === "Active" ? "bg-amber-500" : "bg-emerald-500"}`} />
                            {template.status === "Active" ? "Set as Draft" : "Set as Active"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setTemplateToDelete(template)} 
                            className="rounded-lg cursor-pointer text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTemplates.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    No templates found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
          {previewTemplate && (
            <>
              <div className="bg-muted/50 p-6 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <DialogTitle className="text-xl font-display">{previewTemplate.name}</DialogTitle>
                  {previewTemplate.channel === "WhatsApp" && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"><MessageCircle className="h-3.5 w-3.5"/> WhatsApp</span>}
                  {previewTemplate.channel === "Email" && <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/25"><Mail className="h-3.5 w-3.5"/> Email</span>}
                  {previewTemplate.channel === "SMS" && <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-600 dark:text-violet-400 border border-violet-500/25"><Send className="h-3.5 w-3.5"/> SMS</span>}
                </div>
                <DialogDescription>
                  Preview of the template content.
                </DialogDescription>
              </div>

              <div className="p-6">
                <div className="bg-secondary/40 border border-border rounded-xl p-5 mb-6 relative group">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
                    {previewTemplate.content}
                  </pre>
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" className="rounded-xl flex-1 h-11 bg-[#FFF4E6] hover:bg-[#FFE8CC] text-[#9B3A00]" onClick={() => {
                    handleEditTemplate(previewTemplate);
                  }}>
                    <Edit2 className="h-4 w-4 mr-2" /> Edit
                  </Button>
                </div>
                
                <Button className="rounded-xl w-full h-12 mt-3 text-base shadow-lg" onClick={() => {
                  navigator.clipboard.writeText(previewTemplate.content);
                  toast.success("Template copied to clipboard!");
                }}>
                  Use Template
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">Create New Template</DialogTitle>
            <DialogDescription>Add a new marketing template to your store.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Template Name</label>
              <input 
                type="text" 
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="e.g. Summer Sale"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Channel</label>
              <select 
                value={newTemplate.channel}
                onChange={(e) => setNewTemplate({...newTemplate, channel: e.target.value})}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Email">Email</option>
                <option value="SMS">SMS</option>
                <option value="Other">Other</option>
              </select>
              {newTemplate.channel === "Other" && (
                <input 
                  type="text" 
                  value={newTemplate.customChannel}
                  onChange={(e) => setNewTemplate({...newTemplate, customChannel: e.target.value})}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-2"
                  placeholder="Enter custom channel..."
                />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select 
                value={newTemplate.category}
                onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="Other">Other</option>
              </select>
              {newTemplate.category === "Other" && (
                <input 
                  type="text" 
                  value={newTemplate.customCategory}
                  onChange={(e) => setNewTemplate({...newTemplate, customCategory: e.target.value})}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-2"
                  placeholder="Enter custom category..."
                />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select 
                value={newTemplate.status}
                onChange={(e) => setNewTemplate({...newTemplate, status: e.target.value as "Active" | "Draft"})}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <textarea 
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                className="flex min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Type your template message here..."
              />
            </div>
            <Button 
              className="w-full h-11 rounded-xl mt-2" 
              onClick={() => {
                const finalChannel = newTemplate.channel === "Other" ? newTemplate.customChannel.trim() : newTemplate.channel;
                const finalCategory = newTemplate.category === "Other" ? newTemplate.customCategory.trim() : newTemplate.category;

                if (!newTemplate.name || !newTemplate.content || !finalChannel || !finalCategory) {
                  toast.error("Please fill in all required fields.");
                  return;
                }
                const record = {
                  id: editingTemplateId || crypto.randomUUID(),
                  name: newTemplate.name,
                  audience: finalCategory,
                  type: finalChannel,
                  description: newTemplate.content,
                  status: newTemplate.status || "Active",
                  sentDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                };
                
                if (editingTemplateId) {
                  setDbTemplates((prev: any) => prev.map((t: any) => t.id === editingTemplateId ? { ...t, ...record } : t));
                  toast.success("Template updated successfully!");
                } else {
                  setDbTemplates((prev: any) => [...prev, record]);
                  toast.success("Template created successfully!");
                }
                
                setIsCreateModalOpen(false);
                setEditingTemplateId(null);
                setNewTemplate({ name: "", category: "Featured", channel: "WhatsApp", customCategory: "", customChannel: "", content: "", status: "Active" });
              }}
            >
              {editingTemplateId ? "Save Changes" : "Save Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCampaignModalOpen} onOpenChange={setIsCampaignModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle>New Campaign</DialogTitle>
            <DialogDescription>Send this template to your customers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
               <label className="text-sm font-medium">Selected Template</label>
               <input disabled className="flex h-10 w-full rounded-xl border border-input bg-muted px-3 py-2 text-sm font-medium" value={campaignData?.name || ""} />
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium">Audience / List</label>
               <select className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                 <option>All Customers</option>
                 <option>Recent Bookings (Last 30 days)</option>
                 <option>Active Leads</option>
                 <option>Newsletter Subscribers</option>
               </select>
             </div>
             <Button className="w-full rounded-xl h-11 shadow-md" onClick={() => {
               toast.success(`Campaign "${campaignData?.name}" has been launched!`);
               setIsCampaignModalOpen(false);
               setCampaignData(null);
             }}>
               Launch Campaign
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-display flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete Template
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Are you sure you want to delete the <span className="font-semibold text-foreground">{templateToDelete?.name}</span> template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" className="rounded-xl h-11 px-6" onClick={() => setTemplateToDelete(null)}>
              Cancel
            </Button>
            <Button 
              className="rounded-xl h-11 px-6"
              onClick={() => {
                if (templateToDelete) {
                  setDbTemplates((prev: any) => prev.filter((t: any) => t.id !== templateToDelete.id));
                  toast.success("Template deleted successfully");
                  setTemplateToDelete(null);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Export Templates</DialogTitle>
            <DialogDescription>
              Filter templates by date before downloading as CSV.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 mt-2 mb-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                className="rounded-xl"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                className="rounded-xl"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" className="rounded-xl px-6" onClick={() => setIsExportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportCSV} className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Download className="h-4 w-4 mr-2" /> Download CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
