import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

// Global in-memory cache holding deserialized rows for instant 0ms tab switches
const globalMemoryCache = new Map<string, { data: any[]; timestamp: number }>();

// In-flight fetch promises to deduplicate simultaneous requests for the same table
const inFlightFetches = new Map<string, Promise<any[] | null>>();

// Active subscribers for each table to broadcast updates across components
const tableSubscribers = new Map<string, Set<(data: any[]) => void>>();

// Fast shallow-array / ID-level comparison to prevent unnecessary layout jumps & re-renders
function areArraysIdentical(a: any[] | null | undefined, b: any[] | null | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const itemA = a[i];
    const itemB = b[i];
    if (!itemA || !itemB) return false;
    if (itemA.id !== itemB.id) return false;
    if (itemA.updated_at !== itemB.updated_at) return false;
    if (itemA.updatedAt !== itemB.updatedAt) return false;
    if (itemA !== itemB && JSON.stringify(itemA) !== JSON.stringify(itemB)) {
      return false;
    }
  }
  return true;
}

// Persist helper
function writeToPersistentCache(tableName: string, data: any[]) {
  globalMemoryCache.set(tableName, { data, timestamp: Date.now() });
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`crm_swr_cache_${tableName}`, JSON.stringify(data));
    } catch {
      // ignore storage quota errors
    }
  }
}

/**
 * Force a background revalidation for a specific table or all tables.
 */
export function revalidateTableCache(tableName?: string) {
  if (tableName) {
    globalMemoryCache.delete(tableName);
    inFlightFetches.delete(tableName);
  } else {
    globalMemoryCache.clear();
    inFlightFetches.clear();
  }
}

/**
 * Trigger an active instant refresh for a specific table across all mounted components.
 */
export function triggerTableRefresh(tableName?: string) {
  if (tableName) {
    globalMemoryCache.delete(tableName);
    inFlightFetches.delete(tableName);
  } else {
    globalMemoryCache.clear();
    inFlightFetches.clear();
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("crm_refresh_table", { detail: { tableName } }));
  }
}

/**
 * A high-performance drop-in replacement for useLocalStorage that syncs data with Supabase.
 * Features:
 * - Instant Stale-While-Revalidate (SWR) 0ms hydration from memory and localStorage
 * - Request deduplication for simultaneous component queries
 * - Smooth diff-based reconciliation to eliminate layout jumps
 * - Optimistic UI updates with cross-component broadcasting
 */
export function useSupabaseTable<T extends Array<any>>(tableName: string, initialValue: T) {
  // SWR: Initialize state with memory cache (0ms) or localStorage (0ms) if available
  const [data, setData] = useState<T>(() => {
    // 1. In-memory cache first (0ms instantaneous on tab switch)
    const mem = globalMemoryCache.get(tableName);
    if (mem && Array.isArray(mem.data) && mem.data.length > 0) {
      return mem.data as T;
    }
    // 2. LocalStorage cache next (0ms instantaneous on page load / hard refresh)
    if (typeof window !== "undefined") {
      try {
        let cached = localStorage.getItem(`crm_swr_cache_${tableName}`);
        if (!cached && tableName === "it_support_tickets") {
          cached = localStorage.getItem("crm_it_support_tickets_v1");
        }
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            globalMemoryCache.set(tableName, { data: parsed, timestamp: Date.now() });
            return parsed as T;
          }
        }
      } catch (e) {
        // ignore
      }
    }
    return initialValue;
  });

  const [isLoaded, setIsLoaded] = useState<boolean>(() => {
    if (globalMemoryCache.has(tableName)) return true;
    if (typeof window !== "undefined") {
      try {
        const cached =
          localStorage.getItem(`crm_swr_cache_${tableName}`) ||
          (tableName === "it_support_tickets" ? localStorage.getItem("crm_it_support_tickets_v1") : null);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return true;
        }
      } catch {}
    }
    return false;
  });

  const lastSyncedData = useRef<T>(data);
  const isPendingSync = useRef(false);

  // Cross-component table subscription
  useEffect(() => {
    if (!tableSubscribers.has(tableName)) {
      tableSubscribers.set(tableName, new Set());
    }
    const listener = (newTableData: any[]) => {
      setData((prev) => {
        if (areArraysIdentical(prev, newTableData)) return prev;
        return newTableData as T;
      });
      lastSyncedData.current = newTableData as T;
    };
    tableSubscribers.get(tableName)!.add(listener);

    return () => {
      tableSubscribers.get(tableName)?.delete(listener);
    };
  }, [tableName]);

  // Fetch initial data with deduplication & SWR
  useEffect(() => {
    let isCancelled = false;

    async function fetchData() {
      try {
        if (!inFlightFetches.has(tableName)) {
          const fetchPromise = supabase
            .from(tableName)
            .select("*")
            .order("id", { ascending: false })
            .then(({ data: remoteData, error }) => {
              inFlightFetches.delete(tableName);
              if (error) {
                console.error(`Error fetching ${tableName}:`, error);
                return null;
              }
              return remoteData || [];
            })
            .catch((err) => {
              inFlightFetches.delete(tableName);
              console.error(`Error in ${tableName} fetch:`, err);
              return null;
            });
          inFlightFetches.set(tableName, fetchPromise);
        }

        const remoteData = await inFlightFetches.get(tableName);
        if (isCancelled) return;

        if (remoteData) {
          const unsanitized = remoteData.map(unSanitizeRow) as T;
          lastSyncedData.current = unsanitized;
          writeToPersistentCache(tableName, unsanitized);

          setData((prev) => {
            if (areArraysIdentical(prev, unsanitized)) {
              return prev; // Zero layout shift, no unnecessary re-render!
            }
            return unsanitized;
          });

          // Notify other mounted components using this table
          const subs = tableSubscribers.get(tableName);
          if (subs) {
            for (const sub of subs) {
              sub(unsanitized);
            }
          }
        }
      } catch (err) {
        console.error(`Fetch exception for ${tableName}:`, err);
      } finally {
        if (!isCancelled) {
          setIsLoaded(true);
        }
      }
    }

    fetchData();

    // Subscribe to realtime changes
    const channelId = `${tableName}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on("postgres_changes", { event: "*", schema: "public", table: tableName }, (payload) => {
        if (payload.eventType === "INSERT") {
          const newRow = unSanitizeRow(payload.new);
          setData((prev) => {
            if (prev.some((item: any) => item.id === newRow.id)) return prev;
            const next = [newRow, ...prev] as T;
            writeToPersistentCache(tableName, next);
            return next;
          });
        } else if (payload.eventType === "DELETE") {
          setData((prev) => {
            const next = prev.filter((item: any) => item.id !== payload.old.id) as T;
            writeToPersistentCache(tableName, next);
            return next;
          });
        } else if (payload.eventType === "UPDATE") {
          // Skip realtime UPDATE echo if we have a pending local sync
          if (isPendingSync.current) return;
          const updatedRow = unSanitizeRow(payload.new);
          setData((prev) => {
            const next = prev.map((item: any) =>
              item.id === updatedRow.id ? updatedRow : item,
            ) as T;
            writeToPersistentCache(tableName, next);
            return next;
          });
        }
      })
      .subscribe();

    const handleForceRefresh = (e: any) => {
      if (!e.detail || e.detail.tableName === tableName) {
        fetchData();
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("crm_refresh_table", handleForceRefresh);
    }

    return () => {
      isCancelled = true;
      if (typeof window !== "undefined") {
        window.removeEventListener("crm_refresh_table", handleForceRefresh);
      }
      supabase.removeChannel(channel);
    };
  }, [tableName]);

  function sanitizeRow(row: any) {
    const newRow = { ...row };
    if (tableName === "leads") {
      // Map follow-up date to noteDate column
      if (newRow.nextFollowUp) newRow.noteDate = newRow.nextFollowUp;

      // Strip app-only computed/transient fields (NOT real Supabase columns)
      delete newRow.nextFollowUp;
      delete newRow.lastFollowUp;
    }
    if (tableName === "employees") {
      delete newRow.closedDeals; // not a Supabase column
      delete newRow.notes;       // not a Supabase column

      // Store username & password inside profile_details JSONB
      if (newRow.username || newRow.password) {
        const existingDetails = newRow.profile_details || {};
        newRow.profile_details = {
          ...existingDetails,
          username: newRow.username || existingDetails.username,
          password: newRow.password || existingDetails.password,
        };
      }

      if (newRow.profile_details) {
        let currentDescText = typeof newRow.description === "string" ? newRow.description : "";
        if (currentDescText.includes("_isMeta")) {
          try {
            const parsed = JSON.parse(currentDescText);
            currentDescText = parsed.text || "";
          } catch (e) {}
        }
        newRow.description = JSON.stringify({
          _isMeta: true,
          text: currentDescText,
          profile_details: newRow.profile_details,
        });
      }
    }

    if (tableName === "vendors") {
      // Map app vendor fields to the actual Supabase columns.
      if (newRow.place !== undefined) newRow.location = newRow.place;
      if (newRow.vendorType !== undefined) newRow.category = newRow.vendorType;
      else if (newRow.officeCity !== undefined && !newRow.category) newRow.category = newRow.officeCity;
      if (newRow.mobile !== undefined) newRow.phone = newRow.mobile;
      if (newRow.createdAt !== undefined) newRow.created_at = newRow.createdAt;
      if (newRow.contactPerson !== undefined) {
        newRow.contactperson = newRow.contactPerson;
      }
      delete newRow.place;
      delete newRow.officeCity;
      delete newRow.vendorType;
      delete newRow.mobile;
      delete newRow.createdAt;
      delete newRow.website;
      delete newRow.contacts;
    }

    if (tableName === "certificates" && newRow.date) {
      newRow.issueDate = newRow.date;
      delete newRow.date;
    }
    if (tableName === "leaves" && newRow.empId) {
      newRow.employeeId = newRow.empId;
      delete newRow.empId;
    }
    if (tableName === "assets" && newRow.date) {
      newRow.assignedDate = newRow.date;
      delete newRow.date;
    }
    if (tableName === "payroll" && newRow.date) {
      newRow.month = newRow.date;
      delete newRow.date;
    }
    if (tableName === "feeds") delete newRow.avatar;
    if (tableName === "hr_files" && newRow.date) {
      newRow.uploadedAt = newRow.date;
      delete newRow.date;
    }
    if (tableName === "timelogs" && newRow.employee) {
      newRow.employeeId = newRow.employee;
      delete newRow.employee;
    }
    if (tableName === "packages") delete newRow.active;
    if (tableName === "folders") delete newRow.parentId;
    if (tableName === "reviews" && newRow.empId) {
      newRow.employeeId = newRow.empId;
      delete newRow.empId;
    }

    if (tableName === "leads" || tableName === "insurance_leads") {
      // These are all real columns now — do NOT delete them
      // Only strip truly transient fields
      delete newRow.createdTime; // computed from created_at in unSanitizeRow
    }

    if (tableName === "insurance_leads") {
      // Ensure id is a valid UUID for Supabase, since insurance_leads.id is a UUID column
      const isUuid = typeof newRow.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newRow.id);
      if (!isUuid) {
        newRow.id = crypto.randomUUID();
      }
    }

    if (tableName === "visa" || tableName === "visa_apps") {
      // Pack extra app-only fields (not in Supabase schema) into docs JSONB as metadata
      const visaMeta: any = {};
      if (newRow.phone !== undefined) { visaMeta._phone = newRow.phone; delete newRow.phone; }
      if (newRow.email !== undefined) { visaMeta._email = newRow.email; delete newRow.email; }
      // docs is a JSONB array in Supabase — pack meta alongside it
      const existingDocs = Array.isArray(newRow.docs) ? newRow.docs : [];
      newRow.docs = JSON.stringify([{ _meta: true, ...visaMeta }, ...existingDocs]);
    }

    // Serialize custom fields into existing columns so they store in Supabase
    // without requiring manual SQL schema migrations.
    const customFields: any = {};
    // For leads: allNotes, dob, relationship are REAL columns — keep them in the row, skip customFields
    if (newRow.allNotes !== undefined && tableName !== "employees" && tableName !== "leads" && tableName !== "insurance_leads") customFields.allNotes = newRow.allNotes;
    if (newRow.dob !== undefined && tableName !== "employees" && tableName !== "leads" && tableName !== "insurance_leads") customFields.dob = newRow.dob;
    if (newRow.relationship !== undefined && tableName !== "employees" && tableName !== "leads" && tableName !== "insurance_leads") customFields.relationship = newRow.relationship;
    if (tableName !== "employees" && newRow.profile_details !== undefined) customFields.profile_details = newRow.profile_details;
    if (tableName !== "employees" && newRow.profile_details !== undefined) customFields.profile_details = newRow.profile_details;

    if (tableName === "customers") {
      if (newRow.company !== undefined) customFields.company = newRow.company;
      if (newRow.city !== undefined) customFields.city = newRow.city;
      if (newRow.reference !== undefined) customFields.reference = newRow.reference;
      if (newRow.source !== undefined) customFields.source = newRow.source;
      if (newRow.status !== undefined) customFields.status = newRow.status;
      if (newRow.createdAt !== undefined) customFields.createdAt = newRow.createdAt;
      if (newRow.lastBookingDate !== undefined) customFields.lastBookingDate = newRow.lastBookingDate;
      if (newRow.assignedTo !== undefined) customFields.assignedTo = newRow.assignedTo;
    }

    const hasCustomFields = Object.keys(customFields).length > 0;

    if (tableName === "bookings") {
      if (hasCustomFields) {
        const existingRemarks = newRow.remarks || "";
        newRow.remarks = JSON.stringify({ _isMeta: true, text: existingRemarks, ...customFields });
      }
    }
    if (tableName === "payment_requests") {
      // Map native columns
      if (newRow.createdAt !== undefined) newRow.date = newRow.createdAt;
      else if (newRow.dueDate !== undefined) newRow.date = newRow.dueDate;
      else if (newRow.date === undefined) newRow.date = new Date().toISOString();
      
      if (newRow.employeeName !== undefined) newRow.submittedBy = newRow.employeeName;
      else if (newRow.createdBy !== undefined) newRow.submittedBy = newRow.createdBy;
      else if (newRow.submittedBy === undefined) newRow.submittedBy = "Unknown";
      
      if (newRow.vendor !== undefined) newRow.supplier = newRow.vendor;
      else if (newRow.entityType === "Vendor" && newRow.entityName) newRow.supplier = newRow.entityName;
      else if (newRow.supplier === undefined) newRow.supplier = "N/A";
      
      if (newRow.customer !== undefined) newRow.clientName = newRow.customer;
      else if (newRow.entityType === "Customer" && newRow.entityName) newRow.clientName = newRow.entityName;
      else if (newRow.clientName === undefined) newRow.clientName = "N/A";
      
      if (newRow.requestedAmount !== undefined) newRow.amount = newRow.requestedAmount;
      else if (newRow.amount === undefined) newRow.amount = 0;

      const requestMeta: Record<string, any> = {};
      const metaFields = [
        "paidFor",
        "adminNotes",
        "bookingId",
        "bookingNumber",
        "customer",
        "vendor",
        "serviceType",
        "bookingAmount",
        "vendorPayable",
        "profit",
        "employeeName",
        "requestedAmount",
        "paymentMode",
        "dueDate",
        "priority",
        "remarks",
        "invoiceAttachments",
        "vendorBillAttachments",
        "auditTimeline",
        "accountRemarks",
        "adminRemarks",
        "rejectionReason",
        "paymentDetails",
        "auditLog",
        "remark",
        "accountStatus",
        "adminStatus",
        "createdAt",
        "updatedAt",
        "createdBy",
        "entityType",
        "entityId",
        "entityName",
        "employeeId",
        "invoiceId",
        "receiptId",
        "vendorId",
        "customerId",
        "currency",
        "notes",
        "timeline"
      ];

      const existingRemarks = newRow.remarks || "";
      for (const field of metaFields) {
        if (newRow[field] !== undefined) {
          requestMeta[field] = newRow[field];
          delete newRow[field];
        }
      }

      newRow.remarks = JSON.stringify({ _isMeta: true, text: existingRemarks, ...requestMeta });
    }

    if (tableName === "expenses") {
      const existingDesc = newRow.description || "";
      if (newRow.createdBy !== undefined) {
        newRow.description = JSON.stringify({ _isMeta: true, text: existingDesc, createdBy: newRow.createdBy });
        delete newRow.createdBy;
      }
    }

    if (tableName === "payment_followups") {
      const existingNotes = newRow.notes || "";
      let hasMeta = false;
      const metaObj: any = { _isMeta: true, text: existingNotes };
      if (newRow.createdBy !== undefined) {
        metaObj.createdBy = newRow.createdBy;
        delete newRow.createdBy;
        hasMeta = true;
      }
      if (newRow.status !== undefined) {
        metaObj.status = newRow.status;
        delete newRow.status;
        hasMeta = true;
      }
      if (newRow.outcomeLog !== undefined) {
        metaObj.outcomeLog = newRow.outcomeLog;
        delete newRow.outcomeLog;
        hasMeta = true;
      }
      if (hasMeta) {
        newRow.notes = JSON.stringify(metaObj);
      }
    }

    if (tableName === "transactions") {
      const transactionMeta: Record<string, any> = {};
      const metaFields = ["reference", "status", "invoiceId", "receiptId", "createdBy", "company"];
      
      const existingNotes = newRow.notes || "";
      let hasMeta = false;
      for (const field of metaFields) {
        if (newRow[field] !== undefined) {
          transactionMeta[field] = newRow[field];
          delete newRow[field];
          hasMeta = true;
        }
      }
      
      if (hasMeta) {
        newRow.notes = JSON.stringify({ _isMeta: true, text: existingNotes, ...transactionMeta });
      }
    }

    if (tableName === "customers") {
      if (hasCustomFields) {
        newRow.name = `${newRow.name}---META---${JSON.stringify(customFields)}`;
      }
    } else if (tableName === "employees") {
      // For employees: description stays as plain text
      // profile_details goes directly into the JSONB column (already set above)
      // allNotes is a real JSONB column in Supabase
    }

    if (tableName === "insurance_leads") {
      // insurance_leads: map assignOpsTo → assignToOps
      if (newRow.assignOpsTo) {
        newRow.assignToOps = newRow.assignOpsTo;
      } else if (typeof newRow.assignToOps === "boolean") {
        newRow.assignToOps = null;
      }
      delete newRow.assignOpsTo;
    }
    // All service-specific fields (adults, sourceCity, checkIn, visaType, etc.)
    // are now real columns in both leads and insurance_leads — send them directly

    // For leads and insurance_leads: allNotes, dob, relationship are real Supabase columns — keep them in the row
    if (tableName !== "leads" && tableName !== "insurance_leads") {
      delete newRow.allNotes;
      delete newRow.dob;
      delete newRow.relationship;
    }
    if (tableName !== "employees") delete newRow.profile_details;

    if (tableName === "insurance_policies") {
      const customFields = [
        "school_name", "reference_name", "client_company", "additional_passengers", "alternate_mobile", "payments_out"
      ];
      const metaObj: any = {};
      const existingNotes = newRow.notes || "";
      let hasMeta = false;
      for (const field of customFields) {
        if (newRow[field] !== undefined) {
          metaObj[field] = newRow[field];
          delete newRow[field];
          hasMeta = true;
        }
      }
      if (hasMeta) {
        newRow.notes = JSON.stringify({ _isMeta: true, text: existingNotes, ...metaObj });
      }
    }

    if (tableName === "tasks") {
      // Encode extra fields into description
      const customFields: any = {};
      if (newRow.task_type) customFields.task_type = newRow.task_type;
      if (newRow.parent_id) customFields.parent_id = newRow.parent_id;
      if (newRow.notes) customFields.notes = newRow.notes;
      if (newRow.attachments) customFields.attachments = newRow.attachments;
      if (newRow.customer_id) customFields.customer_id = newRow.customer_id;
      if (newRow.booking_id) customFields.booking_id = newRow.booking_id;
      if (newRow.progress !== undefined) customFields.progress = newRow.progress;
      if (newRow.start_date) customFields.start_date = newRow.start_date;
      if (newRow.completed_at) customFields.completed_at = newRow.completed_at;
      if (newRow.task_number) customFields.task_number = newRow.task_number;
      if (newRow.created_by) customFields.created_by = newRow.created_by;

      if (Object.keys(customFields).length > 0) {
        newRow.note = JSON.stringify({
          _isMeta: true,
          text: newRow.description || "",
          ...customFields
        });
      } else if (newRow.description !== undefined) {
        newRow.note = newRow.description;
      }

      // Map to Supabase native columns for the dashboard
      if (newRow.task_type !== undefined) newRow.type = newRow.task_type;
      if (newRow.assigned_to !== undefined) newRow.assignee = newRow.assigned_to;
      if (newRow.due_date !== undefined) newRow.dueDate = newRow.due_date;

      // Delete the non-existent columns from Supabase payload
      delete newRow.task_type;
      delete newRow.notes;
      delete newRow.assigned_to;
      delete newRow.due_date;
      delete newRow.customer_id;
      delete newRow.booking_id;
      delete newRow.progress;
      delete newRow.start_date;
      delete newRow.completed_at;
      delete newRow.task_number;
      delete newRow.created_by;
      delete newRow.attachments;
      delete newRow.parent_id;
      delete newRow.description;
    }

    if (tableName === "customers") {
      delete newRow.company;
      delete newRow.city;
      delete newRow.reference;
      delete newRow.source;
      delete newRow.status;
      delete newRow.createdAt;
      delete newRow.lastBookingDate;
      delete newRow.assignedTo;
      delete newRow.trips;
      delete newRow.totalSpend;
      delete newRow.tier;
    }

    if (tableName === "attendance") {
      const isUuid = typeof newRow.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newRow.id);
      if (!isUuid) {
        newRow.id = crypto.randomUUID();
      }

      const meta: any = {};
      if (newRow.remark) meta.remark = newRow.remark;
      if (newRow.shift) meta.shift = newRow.shift;
      if (newRow.location) meta.location = newRow.location;
      if (newRow.note) meta.note = newRow.note;

      const baseStatus = (newRow.status || "Present").split("---META---")[0];
      if (Object.keys(meta).length > 0) {
        newRow.status = `${baseStatus}---META---${JSON.stringify(meta)}`;
      } else {
        newRow.status = baseStatus;
      }

      delete newRow.remark;
      delete newRow.shift;
      delete newRow.location;
      delete newRow.note;
      delete newRow.employee_name;
    }

    if (tableName === "it_support_tickets") {
      const isUuid = typeof newRow.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newRow.id);
      if (!isUuid && !newRow.id) {
        newRow.id = crypto.randomUUID();
      }
      if (newRow.ticketNumber !== undefined) { newRow.ticket_number = newRow.ticketNumber; delete newRow.ticketNumber; }
      if (newRow.requesterName !== undefined) { newRow.requester_name = newRow.requesterName; delete newRow.requesterName; }
      if (newRow.requesterRole !== undefined) { newRow.requester_role = newRow.requesterRole; delete newRow.requesterRole; }
      if (newRow.requesterEmail !== undefined) { newRow.requester_email = newRow.requesterEmail; delete newRow.requesterEmail; }
      if (newRow.requesterPhone !== undefined) { newRow.requester_phone = newRow.requesterPhone; delete newRow.requesterPhone; }
      if (newRow.relatedReference !== undefined) { newRow.related_reference = newRow.relatedReference; delete newRow.relatedReference; }
      if (newRow.stepsToReproduce !== undefined) { newRow.steps_to_reproduce = newRow.stepsToReproduce; delete newRow.stepsToReproduce; }
      if (newRow.screenshotUrl !== undefined) { newRow.screenshot_url = newRow.screenshotUrl; delete newRow.screenshotUrl; }
      if (newRow.itAssignee !== undefined) { newRow.it_assignee = newRow.itAssignee; delete newRow.itAssignee; }
      if (newRow.itResolutionNotes !== undefined) { newRow.it_resolution_notes = newRow.itResolutionNotes; delete newRow.itResolutionNotes; }
      if (newRow.resolutionDate !== undefined) { newRow.resolution_date = newRow.resolutionDate; delete newRow.resolutionDate; }
      if (newRow.feedbackRating !== undefined) { newRow.feedback_rating = newRow.feedbackRating; delete newRow.feedbackRating; }
      if (newRow.feedbackText !== undefined) { newRow.feedback_text = newRow.feedbackText; delete newRow.feedbackText; }
      if (newRow.feedbackSubmittedAt !== undefined) { newRow.feedback_submitted_at = newRow.feedbackSubmittedAt; delete newRow.feedbackSubmittedAt; }
      if (newRow.createdAt !== undefined) { newRow.created_at = newRow.createdAt; delete newRow.createdAt; }
      if (newRow.updatedAt !== undefined) { newRow.updated_at = newRow.updatedAt; delete newRow.updatedAt; }
    }

    return newRow;
  }

  function unSanitizeRow(row: any) {
    const newRow = { ...row };
    if (tableName === "leads" || tableName === "insurance_leads") {
      if (newRow.assignedto && !newRow.assignedTo) newRow.assignedTo = newRow.assignedto;
      if (newRow.noteDate) newRow.nextFollowUp = newRow.noteDate;
      // Fallback: if whatsapp wasn't stored in meta, it might be in reference from older records
      // Follow-up date stored in noteDate column
      if (newRow.noteDate) newRow.nextFollowUp = newRow.noteDate;
      // adults mirrors pax if adults column not set (old records)
      if (newRow.adults == null && newRow.pax != null) newRow.adults = newRow.pax;
      // children column is now real; fall back to queryType for old records
      if (newRow.children == null && newRow.queryType != null) newRow.children = Number(newRow.queryType) || 0;
      if (newRow.created_at) {
        const d = new Date(newRow.created_at);
        newRow.createdAt = d.toISOString().slice(0, 10);
        newRow.createdTime = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      }
    }
    if (tableName === "certificates" && newRow.issueDate) {
      newRow.date = newRow.issueDate;
    }
    if (tableName === "leaves" && newRow.employeeId) {
      newRow.empId = newRow.employeeId;
    }
    if (tableName === "assets" && newRow.assignedDate) {
      newRow.date = newRow.assignedDate;
    }
    if (tableName === "payroll" && newRow.month) {
      newRow.date = newRow.month;
    }
    if (tableName === "hr_files" && newRow.uploadedAt) {
      newRow.date = newRow.uploadedAt;
    }
    if (tableName === "timelogs" && newRow.employeeId) {
      newRow.employee = newRow.employeeId;
    }
    if (tableName === "reviews" && newRow.employeeId) {
      newRow.empId = newRow.employeeId;
    }

    if (tableName === "visa" || tableName === "visa_apps") {
      // Unpack docs JSONB — extract meta and restore extra fields
      try {
        const docsRaw = newRow.docs;
        const docsArr = Array.isArray(docsRaw) ? docsRaw : (typeof docsRaw === "string" ? JSON.parse(docsRaw) : []);
        const metaEntry = docsArr.find((d: any) => d && d._meta === true);
        if (metaEntry) {
          if (metaEntry._phone !== undefined) newRow.phone = metaEntry._phone;
          if (metaEntry._email !== undefined) newRow.email = metaEntry._email;
          newRow.docs = docsArr.filter((d: any) => !d._meta);
        } else {
          newRow.docs = docsArr;
        }
      } catch (e) {
        newRow.docs = [];
      }
    }

    // Backward-compat: old records stored extra fields as meta JSON in notes
    // New records use real columns — notes is plain text
    if ((tableName === "leads" || tableName === "insurance_leads") && typeof newRow.notes === "string" && newRow.notes.includes("_isMeta")) {
      try {
        const parsed = JSON.parse(newRow.notes);
        if (parsed._isMeta) {
          newRow.notes = parsed.text ?? "";
          // Restore any fields that were packed in old meta (only set if real column is empty)
          if (!newRow.whatsapp && parsed.whatsapp) newRow.whatsapp = parsed.whatsapp;
          if (!newRow.leadSection && parsed.leadSection) newRow.leadSection = parsed.leadSection;
          if (parsed.allNotes !== undefined) newRow.allNotes = parsed.allNotes;
          const legacyFields = [
            "sourceCity","destinationCity","infants","fareType","directFlight","flightClass","preferredAirline",
            "checkIn","checkOut","nights","nationality","starRating","mealPreference",
            "visaType","passportExpiry","country",
            "goingFrom","noOfDays","inclusions","theme","hotelPreference","foodPreference",
            "companyName","eventType","assignToOps","assignOpsTo","adults","children",
            "policyType","queryType","insuranceDate","expiryDate","clientCompany",
            "assignedto"
          ] as const;
          for (const f of legacyFields) {
            if (newRow[f] == null && parsed[f] !== undefined) newRow[f] = parsed[f];
          }
          // Restore assignedTo from meta assignedto for insurance_leads
          if (!newRow.assignedTo && parsed.assignedto) newRow.assignedTo = parsed.assignedto;
        }
      } catch (e) { }
    }

    if (tableName === "bookings" && typeof newRow.remarks === "string" && newRow.remarks.includes("_isMeta")) {
      try {
        const parsed = JSON.parse(newRow.remarks);
        if (parsed._isMeta) {
          newRow.remarks = parsed.text;
          if (parsed.allNotes !== undefined) newRow.allNotes = parsed.allNotes;
          if (parsed.dob !== undefined) newRow.dob = parsed.dob;
          if (parsed.relationship !== undefined) newRow.relationship = parsed.relationship;
        }
      } catch (e) { }
    }

    if (tableName === "payment_requests" && typeof newRow.remarks === "string" && newRow.remarks.includes("_isMeta")) {
      try {
        const parsed = JSON.parse(newRow.remarks);
        if (parsed._isMeta) {
          newRow.remarks = parsed.text;
          const metaFields = [
            "paidFor",
            "adminNotes",
            "bookingId",
            "bookingNumber",
            "customer",
            "vendor",
            "serviceType",
            "bookingAmount",
            "vendorPayable",
            "profit",
            "employeeName",
            "requestedAmount",
            "paymentMode",
            "dueDate",
            "priority",
            "invoiceAttachments",
            "vendorBillAttachments",
            "auditTimeline",
            "accountRemarks",
            "adminRemarks",
            "rejectionReason",
            "paymentDetails",
            "accountStatus",
            "adminStatus",
            "createdAt",
            "updatedAt",
            "createdBy",
            "entityType",
            "entityId",
            "entityName",
            "employeeId",
            "invoiceId",
            "auditLog",
            "remark",
            "receiptId",
            "vendorId",
            "customerId",
            "currency",
            "notes",
            "timeline"
          ];
          for (const field of metaFields) {
            if (parsed[field] !== undefined) {
              newRow[field] = parsed[field];
            }
          }
        }
      } catch (e) { }
    }

    if (tableName === "transactions" && typeof newRow.notes === "string" && newRow.notes.includes("_isMeta")) {
      try {
        const parsed = JSON.parse(newRow.notes);
        if (parsed._isMeta) {
          newRow.notes = parsed.text;
          const metaFields = ["reference", "status", "invoiceId", "receiptId", "createdBy", "company"];
          for (const field of metaFields) {
            if (parsed[field] !== undefined) {
              newRow[field] = parsed[field];
            }
          }
        }
      } catch (e) { }
    }

    if (tableName === "expenses" && typeof newRow.description === "string" && newRow.description.includes("_isMeta")) {
      try {
        const parsed = JSON.parse(newRow.description);
        if (parsed._isMeta) {
          newRow.description = parsed.text;
          if (parsed.createdBy !== undefined) newRow.createdBy = parsed.createdBy;
        }
      } catch (e) { }
    }

    if (tableName === "payment_followups" && typeof newRow.notes === "string" && newRow.notes.includes("_isMeta")) {
      try {
        const parsed = JSON.parse(newRow.notes);
        if (parsed._isMeta) {
          newRow.notes = parsed.text;
          if (parsed.createdBy !== undefined) newRow.createdBy = parsed.createdBy;
          if (parsed.status !== undefined) newRow.status = parsed.status;
          if (parsed.outcomeLog !== undefined) newRow.outcomeLog = parsed.outcomeLog;
        }
      } catch (e) { }
    }

    if (tableName === "payment_requests") {
      if (newRow.date && !newRow.createdAt) newRow.createdAt = newRow.date;
      if (newRow.submittedBy && !newRow.employeeName) newRow.employeeName = newRow.submittedBy;
      if (newRow.supplier && !newRow.vendor) newRow.vendor = newRow.supplier;
      if (newRow.clientName && !newRow.customer) newRow.customer = newRow.clientName;
      if (newRow.amount !== undefined && newRow.requestedAmount === undefined) newRow.requestedAmount = newRow.amount;
    }

    if (tableName === "insurance_policies" && typeof newRow.notes === "string" && newRow.notes.includes("_isMeta")) {
      try {
        const parsed = JSON.parse(newRow.notes);
        if (parsed._isMeta) {
          newRow.notes = parsed.text;
          const customFields = [
            "school_name", "reference_name", "client_company", "additional_passengers", "alternate_mobile", "payments_out"
          ] as const;
          for (const field of customFields) {
            if (parsed[field] !== undefined) {
              newRow[field] = parsed[field];
            }
          }
        }
      } catch (e) { }
    }

    if (tableName === "customers" && typeof newRow.name === "string" && newRow.name.includes("---META---")) {
      try {
        const parts = newRow.name.split("---META---");
        newRow.name = parts[0];
        const parsed = JSON.parse(parts[1]);
        if (parsed.allNotes !== undefined) newRow.allNotes = parsed.allNotes;
        if (parsed.dob !== undefined) newRow.dob = parsed.dob;
        if (parsed.relationship !== undefined) newRow.relationship = parsed.relationship;
        if (parsed.company !== undefined) newRow.company = parsed.company;
        if (parsed.city !== undefined) newRow.city = parsed.city;
        if (parsed.reference !== undefined) newRow.reference = parsed.reference;
        if (parsed.source !== undefined) newRow.source = parsed.source;
        if (parsed.status !== undefined) newRow.status = parsed.status;
        if (parsed.createdAt !== undefined) newRow.createdAt = parsed.createdAt;
        if (parsed.lastBookingDate !== undefined) newRow.lastBookingDate = parsed.lastBookingDate;
        if (parsed.assignedTo !== undefined) newRow.assignedTo = parsed.assignedTo;
      } catch (e) { }
    }

    if (tableName === "employees") {
      if (typeof newRow.description === "string" && newRow.description.includes("_isMeta")) {
        try {
          const parsed = JSON.parse(newRow.description);
          if (parsed._isMeta) {
            newRow.description = parsed.text;
            if (parsed.allNotes !== undefined) newRow.allNotes = parsed.allNotes;
            if (parsed.dob !== undefined) newRow.dob = parsed.dob;
            if (parsed.relationship !== undefined) newRow.relationship = parsed.relationship;
            if (parsed.profile_details !== undefined && !newRow.profile_details) {
              newRow.profile_details = parsed.profile_details;
            }
          }
        } catch (e) { }
      }
      if (newRow.profile_details?.username) {
        newRow.username = newRow.profile_details.username;
      }
      if (newRow.profile_details?.password) {
        newRow.password = newRow.profile_details.password;
      }
    }

    if (tableName === "vendors") {
      if (newRow.location !== undefined) newRow.place = newRow.location;
      if (newRow.category !== undefined) newRow.vendorType = newRow.category;
      if (newRow.phone !== undefined) newRow.mobile = newRow.phone;
      if (newRow.contactperson !== undefined) newRow.contactPerson = newRow.contactperson;
      if (newRow.created_at !== undefined) {
        const d = new Date(newRow.created_at);
        newRow.createdAt = d.toISOString().slice(0, 10);
      }
      if (newRow.contactPerson !== undefined && newRow.contactperson === undefined) {
        newRow.contactperson = newRow.contactPerson;
      }
      if (newRow.status !== undefined) newRow.status = String(newRow.status);
      // Preserve notes if present.
    }

    if (tableName === "tasks") {
      if (newRow.type !== undefined) newRow.task_type = newRow.type;
      if (newRow.assignee !== undefined) newRow.assigned_to = newRow.assignee;
      if (newRow.dueDate !== undefined) newRow.due_date = newRow.dueDate;

      if (newRow.note !== undefined) {
        newRow.description = newRow.note;
      }
    }

    if (tableName === "tasks" && typeof newRow.description === "string" && newRow.description.includes("_isMeta")) {
      try {
        const parsed = JSON.parse(newRow.description);
        if (parsed._isMeta) {
          newRow.description = parsed.text;
          if (parsed.task_type !== undefined) newRow.task_type = parsed.task_type;
          if (parsed.parent_id !== undefined) newRow.parent_id = parsed.parent_id;
          if (parsed.notes !== undefined) newRow.notes = parsed.notes;
          if (parsed.attachments !== undefined) newRow.attachments = parsed.attachments;
          if (parsed.customer_id !== undefined) newRow.customer_id = parsed.customer_id;
          if (parsed.booking_id !== undefined) newRow.booking_id = parsed.booking_id;
          if (parsed.progress !== undefined) newRow.progress = parsed.progress;
          if (parsed.start_date !== undefined) newRow.start_date = parsed.start_date;
          if (parsed.completed_at !== undefined) newRow.completed_at = parsed.completed_at;
          if (parsed.task_number !== undefined) newRow.task_number = parsed.task_number;
          if (parsed.created_by !== undefined) newRow.created_by = parsed.created_by;
        }
      } catch (e) { }
    }

    // Safety guard: notes must always be an array - handle broken data from a past bad commit
    if (tableName === "tasks") {
      if (typeof newRow.notes === "string") {
        try {
          const parsedNotes = JSON.parse(newRow.notes);
          if (parsedNotes && parsedNotes._isMeta) {
            // This was a bad meta payload accidentally written to notes column - recover fields
            if (parsedNotes.task_type !== undefined && !newRow.task_type) newRow.task_type = parsedNotes.task_type;
            if (parsedNotes.parent_id !== undefined && !newRow.parent_id) newRow.parent_id = parsedNotes.parent_id;
            if (parsedNotes.attachments !== undefined) newRow.attachments = parsedNotes.attachments;
            if (parsedNotes.customer_id !== undefined) newRow.customer_id = parsedNotes.customer_id;
            if (parsedNotes.booking_id !== undefined) newRow.booking_id = parsedNotes.booking_id;
            if (parsedNotes.progress !== undefined) newRow.progress = parsedNotes.progress;
            if (parsedNotes.start_date !== undefined) newRow.start_date = parsedNotes.start_date;
            if (parsedNotes.completed_at !== undefined) newRow.completed_at = parsedNotes.completed_at;
            if (parsedNotes.task_number !== undefined) newRow.task_number = parsedNotes.task_number;
            if (parsedNotes.created_by !== undefined) newRow.created_by = parsedNotes.created_by;
            if (parsedNotes.description !== undefined && !newRow.description) newRow.description = parsedNotes.description;
            if (parsedNotes.module !== undefined) newRow.module = parsedNotes.module;
            if (parsedNotes.invoiceId !== undefined) newRow.invoiceId = parsedNotes.invoiceId;
            if (parsedNotes.reference !== undefined) newRow.reference = parsedNotes.reference;
            if (parsedNotes.status !== undefined && !newRow.status) newRow.status = parsedNotes.status;
            newRow.notes = []; // reset notes to empty array
          } else if (Array.isArray(parsedNotes)) {
            newRow.notes = parsedNotes;
          } else {
            newRow.notes = [];
          }
        } catch (e) {
          newRow.notes = []; // not valid JSON, reset
        }
      } else if (!Array.isArray(newRow.notes)) {
        newRow.notes = [];
      }
    }

    if (tableName === "insurance_leads") {
      if (!newRow.leadSection) {
        newRow.leadSection = "General Insurance";
      }
      if (newRow.assignToOps && typeof newRow.assignToOps === 'string') {
        newRow.assignOpsTo = newRow.assignToOps;
      }
    }

    if (tableName === "attendance" && typeof newRow.status === "string" && newRow.status.includes("---META---")) {
      try {
        const parts = newRow.status.split("---META---");
        newRow.status = parts[0] || "";
        const metaStr = parts.slice(1).join("---META---");
        if (metaStr.startsWith("{")) {
          const parsed = JSON.parse(metaStr);
          if (parsed.remark) newRow.remark = parsed.remark;
          if (parsed.shift) newRow.shift = parsed.shift;
          if (parsed.location) newRow.location = parsed.location;
          if (parsed.note) newRow.note = parsed.note;
        } else {
          newRow.remark = metaStr;
        }
      } catch (e) { }
    }

    if (tableName === "it_support_tickets") {
      if (newRow.ticket_number && !newRow.ticketNumber) newRow.ticketNumber = newRow.ticket_number;
      if (newRow.requester_name && !newRow.requesterName) newRow.requesterName = newRow.requester_name;
      if (newRow.requester_role && !newRow.requesterRole) newRow.requesterRole = newRow.requester_role;
      if (newRow.requester_email && !newRow.requesterEmail) newRow.requesterEmail = newRow.requester_email;
      if (newRow.requester_phone && !newRow.requesterPhone) newRow.requesterPhone = newRow.requester_phone;
      if (newRow.related_reference && !newRow.relatedReference) newRow.relatedReference = newRow.related_reference;
      if (newRow.steps_to_reproduce && !newRow.stepsToReproduce) newRow.stepsToReproduce = newRow.steps_to_reproduce;
      if (newRow.screenshot_url && !newRow.screenshotUrl) newRow.screenshotUrl = newRow.screenshot_url;
      if (newRow.it_assignee && !newRow.itAssignee) newRow.itAssignee = newRow.it_assignee;
      if (newRow.it_resolution_notes && !newRow.itResolutionNotes) newRow.itResolutionNotes = newRow.it_resolution_notes;
      if (newRow.feedback_rating !== undefined && newRow.feedbackRating === undefined) newRow.feedbackRating = newRow.feedback_rating;
      if (newRow.feedback_text !== undefined && newRow.feedbackText === undefined) newRow.feedbackText = newRow.feedback_text;
      if (newRow.feedback_submitted_at !== undefined && newRow.feedbackSubmittedAt === undefined) newRow.feedbackSubmittedAt = newRow.feedback_submitted_at;
      if (newRow.created_at && !newRow.createdAt) newRow.createdAt = newRow.created_at;
      if (newRow.updated_at && !newRow.updatedAt) newRow.updatedAt = newRow.updated_at;
      if (typeof newRow.comments === "string") {
        try {
          newRow.comments = JSON.parse(newRow.comments);
        } catch {
          newRow.comments = [];
        }
      }
    }

    return newRow;
  }

  // Sync mutations back to Supabase
  const syncToSupabase = async (oldArray: T, newArray: T) => {
    const oldIds = new Set(oldArray.map((item: any) => item.id));
    const newIds = new Set(newArray.map((item: any) => item.id));

    // Find Deletions (in old, but not in new)
    const toDelete = oldArray.filter((item: any) => !newIds.has(item.id));
    for (const item of toDelete) {
      const { error } = await supabase.from(tableName).delete().eq("id", item.id);
      if (error) console.error(`[${tableName}] DELETE error:`, error.message, error.details);
    }

    // Find Insertions (in new, but not in old)
    const toInsert = newArray.filter((item: any) => !oldIds.has(item.id)).map(sanitizeRow);
    if (toInsert.length > 0) {
      console.log(`[${tableName}] Inserting rows:`, JSON.stringify(toInsert, null, 2));
      const { error, data } = await supabase.from(tableName).insert(toInsert).select();
      if (error) {
        console.error(`[${tableName}] INSERT error:`, error.message, error.details, error.hint);
        
        // Fallback for customers
        if (tableName === "customers" && (error.message?.includes("column") || error.code === "42703" || error.code === "PGRST204")) {
          console.warn("[customers] Retrying INSERT with base columns only (run the SQL migration to enable all fields)");
          const NEW_CUST_COLS = [
            "company","city","reference","source","status","assignedTo","dob","dateOfAnniversary","gst"
          ];
          const fallbackRows = toInsert.map((row: any) => {
            const safe = { ...row };
            for (const col of NEW_CUST_COLS) delete safe[col];
            return safe;
          });
          const { error: err2, data: data2 } = await supabase.from(tableName).insert(fallbackRows).select();
          if (err2) {
            console.error(`[${tableName}] Fallback INSERT also failed:`, err2.message, err2.details);
          } else if (data2 && data2.length > 0) {
            console.log(`[${tableName}] Fallback INSERT success (base columns):`, data2);
            const unsanitized = data2.map(unSanitizeRow);
            setData((prev: any) => {
              const updated = prev.map((item: any) => {
                const saved = unsanitized.find((u: any) => (u.name && item.name && u.name === item.name) || u.id === item.id);
                return saved ? { ...item, ...saved } : item;
              });
              lastSyncedData.current = updated;
              return updated;
            });
          }
        }

        // Fallback for it_support_tickets INSERT
        if (tableName === "it_support_tickets" && (error.message?.includes("column") || error.code === "42703" || error.code === "PGRST204")) {
          const fallbackRows = toInsert.map((row: any) => {
            const safe = { ...row };
            delete safe.feedback_rating;
            delete safe.feedback_text;
            delete safe.feedback_submitted_at;
            return safe;
          });
          const { error: err2, data: data2 } = await supabase.from(tableName).insert(fallbackRows).select();
          if (err2) {
            console.error(`[${tableName}] Fallback INSERT also failed:`, err2.message);
          } else if (data2 && data2.length > 0) {
            console.log(`[${tableName}] Fallback INSERT success:`, data2);
            const unsanitized = data2.map(unSanitizeRow);
            setData((prev: any) => {
              const updated = prev.map((item: any) => {
                const saved = unsanitized.find((u: any) => u.id === item.id);
                return saved ? { ...item, ...saved } : item;
              });
              lastSyncedData.current = updated;
              return updated;
            });
          }
        }
      } else if (data && data.length > 0) {
        console.log(`[${tableName}] INSERT success:`, data);
        const unsanitized = data.map(unSanitizeRow);
        setData((prev: any) => {
          const updated = prev.map((item: any) => {
            const saved = unsanitized.find((u: any) => (u.name && item.name && u.name === item.name) || u.id === item.id);
            return saved ? { ...item, ...saved } : item;
          });
          lastSyncedData.current = updated;
          return updated;
        });
      }
    }


    // Find Updates
    const toUpdate = newArray
      .filter((item: any) => {
        if (!oldIds.has(item.id)) return false;
        const oldItem = oldArray.find((old: any) => old.id === item.id);
        return oldItem !== item;
      })
      .map(sanitizeRow);

    for (const item of toUpdate) {
      console.log(`[${tableName}] Updating row:`, JSON.stringify(item, null, 2));
      const { error, data } = await supabase.from(tableName).update(item).eq("id", item.id).select();
      if (error) {
        console.error(`[${tableName}] UPDATE error:`, error.message, error.details, error.hint);

        // Fallback for customers UPDATE
        if (tableName === "customers" && (error.message?.includes("column") || error.code === "42703" || error.code === "PGRST204")) {
          const NEW_CUST_COLS = [
            "company","city","reference","source","status","assignedTo","dob","dateOfAnniversary","gst"
          ];
          const safe = { ...item };
          for (const col of NEW_CUST_COLS) delete safe[col];
          const { error: err2 } = await supabase.from(tableName).update(safe).eq("id", item.id);
          if (err2) console.error("[customers] Fallback UPDATE failed:", err2.message);
        }

        // Fallback for it_support_tickets UPDATE
        if (tableName === "it_support_tickets" && (error.message?.includes("column") || error.code === "42703" || error.code === "PGRST204")) {
          const safe = { ...item };
          delete safe.feedback_rating;
          delete safe.feedback_text;
          delete safe.feedback_submitted_at;
          const { error: err2 } = await supabase.from(tableName).update(safe).eq("id", item.id);
          if (err2) console.error("[it_support_tickets] Fallback UPDATE failed:", err2.message);
        }

      } else {
        console.log(`[${tableName}] UPDATE success:`, data);
      }
    }
  };

  const setSupabaseData = useCallback(
    (value: T | ((val: T) => T)) => {
      isPendingSync.current = true;
      setData((prev) => {
        const next = typeof value === "function" ? (value as any)(prev) : value;
        writeToPersistentCache(tableName, next);
        const subs = tableSubscribers.get(tableName);
        if (subs) {
          for (const sub of subs) {
            sub(next);
          }
        }
        return next;
      });
    },
    [tableName],
  );

  // Sync mutations to Supabase when data changes
  useEffect(() => {
    if (!isLoaded) return;
    if (isPendingSync.current) {
      const oldData = lastSyncedData.current;
      lastSyncedData.current = data;
      syncToSupabase(oldData, data)
        .catch((err) => {
          console.error(`Error syncing ${tableName} to Supabase:`, err);
        })
        .finally(() => {
          isPendingSync.current = false;
        });
    } else {
      // Realtime update or initial load
      lastSyncedData.current = data;
    }
  }, [data, isLoaded, tableName]);

  return [data, setSupabaseData, isLoaded] as const;
}
