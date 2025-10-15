# 🔗 Database Relationships & ER Diagram

Complete documentation of all table relationships and entity-relationship structure in the SkyNest Hotels system.

---

## 📋 Table of Contents

1. [Entity Relationship Diagram](#entity-relationship-diagram)
2. [Relationship Types](#relationship-types)
3. [Foreign Key Constraints](#foreign-key-constraints)
4. [Cascade Rules](#cascade-rules)
5. [Relationship Details](#relationship-details)

---

## Entity Relationship Diagram

```
┌─────────────────┐
│ hotel_branches  │
│ PK: branch_id   │
└────────┬────────┘
         │
         │ 1:N
         ├──────────────────────────────────────┐
         │                                      │
         ▼                                      ▼
┌─────────────────┐                   ┌─────────────────┐
│     rooms       │                   │     users       │
│ PK: room_id     │                   │ PK: user_id     │
│ FK: branch_id   │                   │ FK: branch_id   │
│ FK: room_type_id│                   └────────┬────────┘
└────────┬────────┘                            │
         │                                     │ 1:1
         │ N:1                                 ▼
         │                            ┌─────────────────┐
┌─────────────────┐                   │     guests      │
│   room_types    │                   │ PK: guest_id    │
│ PK: room_type_id│                   │ FK: user_id     │
└─────────────────┘                   └────────┬────────┘
                                               │
                                               │ 1:N
                                               ▼
                                      ┌─────────────────┐
                                      │    bookings     │
                                      │ PK: booking_id  │
                                      │ FK: guest_id    │
                                      │ FK: room_id     │
                                      │ FK: branch_id   │
                                      │ FK: created_by  │
                                      └────────┬────────┘
                                               │
                        ┌──────────────────────┼──────────────────────┐
                        │                      │                      │
                        │ 1:N                  │ 1:N                  │ 1:N
                        ▼                      ▼                      ▼
              ┌─────────────────┐    ┌─────────────────┐   ┌─────────────────┐
              │  service_usage  │    │    payments     │   │service_requests │
              │ PK: usage_id    │    │ PK: payment_id  │   │ PK: request_id  │
              │ FK: booking_id  │    │ FK: booking_id  │   │ FK: booking_id  │
              │ FK: service_id  │    │ FK: processed_by│   │ FK: guest_id    │
              └─────────┬───────┘    └─────────────────┘   │ FK: service_id  │
                        │                                   │ FK: branch_id   │
                        │ N:1                               │ FK: reviewed_by │
                        ▼                                   └─────────────────┘
              ┌─────────────────┐
              │service_catalogue│
              │ PK: service_id  │
              └────────┬────────┘
                       │
                       │ N:M (via branch_services)
                       ▼
              ┌─────────────────┐
              │branch_services  │
              │ PK: branch_srv_id│
              │ FK: branch_id   │
              │ FK: service_id  │
              └─────────────────┘

┌─────────────────┐
│support_tickets  │
│ PK: ticket_id   │
│ FK: guest_id    │
│ FK: booking_id  │
│ FK: assigned_to │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│ticket_responses │
│ PK: response_id │
│ FK: ticket_id   │
│ FK: user_id     │
│ FK: guest_id    │
└─────────────────┘

┌─────────────────┐
│   audit_log     │
│ PK: log_id      │
│ FK: user_id     │
└─────────────────┘
```

---

## Relationship Types

### One-to-Many (1:N)

| Parent Table | Child Table | Description |
|--------------|-------------|-------------|
| hotel_branches | rooms | One branch has many rooms |
| hotel_branches | users | One branch has many staff |
| hotel_branches | bookings | One branch has many bookings |
| hotel_branches | service_requests | One branch has many requests |
| room_types | rooms | One type has many rooms |
| users | bookings (created_by) | One user creates many bookings |
| users | payments (processed_by) | One user processes many payments |
| users | service_requests (reviewed_by) | One user reviews many requests |
| users | support_tickets (assigned_to) | One user handles many tickets |
| users | ticket_responses | One user writes many responses |
| users | audit_log | One user has many log entries |
| guests | bookings | One guest has many bookings |
| guests | service_requests | One guest makes many requests |
| guests | support_tickets | One guest creates many tickets |
| guests | ticket_responses | One guest writes many responses |
| rooms | bookings | One room has many bookings |
| bookings | service_usage | One booking has many services |
| bookings | payments | One booking has many payments |
| bookings | service_requests | One booking has many requests |
| bookings | support_tickets | One booking has many tickets |
| service_catalogue | service_usage | One service used many times |
| service_catalogue | service_requests | One service requested many times |
| support_tickets | ticket_responses | One ticket has many responses |

### One-to-One (1:1)

| Table 1 | Table 2 | Description |
|---------|---------|-------------|
| users | guests | One user account per guest (optional) |

### Many-to-Many (N:M)

| Table 1 | Junction Table | Table 2 | Description |
|---------|----------------|---------|-------------|
| hotel_branches | branch_services | service_catalogue | Branches offer services with custom pricing |

---

## Foreign Key Constraints

### hotel_branches
**No foreign keys** (root entity)

### room_types
**No foreign keys** (lookup table)

### rooms
| Foreign Key | References | On Delete | On Update |
|-------------|------------|-----------|-----------|
| branch_id | hotel_branches(branch_id) | CASCADE | CASCADE |
| room_type_id | room_types(room_type_id) | RESTRICT | CASCADE |

**Cascade Rules:**
- `CASCADE` on branch: If branch deleted, all rooms deleted
- `RESTRICT` on room_type: Cannot delete room type if rooms exist

### users
| Foreign Key | References | On Delete | On Update |
|-------------|------------|-----------|-----------|
| branch_id | hotel_branches(branch_id) | SET NULL | CASCADE |

**Cascade Rules:**
- `SET NULL`: If branch deleted, user's branch_id becomes NULL (user remains)

### guests
| Foreign Key | References | On Delete | On Update |
|-------------|------------|-----------|-----------|
| user_id | users(user_id) | SET NULL | CASCADE |

**Cascade Rules:**
- `SET NULL`: If user account deleted, guest profile remains

### bookings
| Foreign Key | References | On Delete | On Update |
|-------------|------------|-----------|-----------|
| guest_id | guests(guest_id) | RESTRICT | CASCADE |
| room_id | rooms(room_id) | RESTRICT | CASCADE |
| branch_id | hotel_branches(branch_id) | RESTRICT | CASCADE |
| created_by | users(user_id) | SET NULL | CASCADE |

**Cascade Rules:**
- `RESTRICT`: Cannot delete guest/room/branch with active bookings
- `SET NULL`: If staff user deleted, booking remains (creator unknown)

### service_catalogue
**No foreign keys** (master data)

### branch_services
| Foreign Key | References | On Delete | On Update |
|-------------|------------|-----------|-----------|
| branch_id | hotel_branches(branch_id) | CASCADE | CASCADE |
| service_id | service_catalogue(service_id) | CASCADE | CASCADE |

**Cascade Rules:**
- `CASCADE`: If branch or service deleted, custom pricing deleted

### service_usage
| Foreign Key | References | On Delete | On Update |
|-------------|------------|-----------|-----------|
| booking_id | bookings(booking_id) | CASCADE | CASCADE |
| service_id | service_catalogue(service_id) | RESTRICT | CASCADE |

**Cascade Rules:**
- `CASCADE`: If booking deleted, service usage deleted
- `RESTRICT`: Cannot delete service if usage exists

### service_requests
| Foreign Key | References | On Delete | On Update |
|-------------|------------|-----------|-----------|
| booking_id | bookings(booking_id) | CASCADE | CASCADE |
| guest_id | guests(guest_id) | CASCADE | CASCADE |
| service_id | service_catalogue(service_id) | CASCADE | CASCADE |
| branch_id | hotel_branches(branch_id) | CASCADE | CASCADE |
| reviewed_by | users(user_id) | SET NULL | CASCADE |

**Cascade Rules:**
- `CASCADE`: Request deleted if booking/guest/service/branch deleted
- `SET NULL`: Reviewer info removed if user deleted

### payments
| Foreign Key | References | On Delete | On Update |
|-------------|------------|-----------|-----------|
| booking_id | bookings(booking_id) | CASCADE | CASCADE |
| processed_by | users(user_id) | SET NULL | CASCADE |

**Cascade Rules:**
- `CASCADE`: Payments deleted with booking
- `SET NULL`: Processor info removed if user deleted

### support_tickets
| Foreign Key | References | On Delete | On Update |
|-------------|------------|-----------|-----------|
| guest_id | guests(guest_id) | RESTRICT | CASCADE |
| booking_id | bookings(booking_id) | SET NULL | CASCADE |
| assigned_to | users(user_id) | SET NULL | CASCADE |

**Cascade Rules:**
- `RESTRICT`: Cannot delete guest with open tickets
- `SET NULL`: Ticket remains if booking/assignee deleted

### ticket_responses
| Foreign Key | References | On Delete | On Update |
|-------------|------------|-----------|-----------|
| ticket_id | support_tickets(ticket_id) | CASCADE | CASCADE |
| user_id | users(user_id) | SET NULL | CASCADE |
| guest_id | guests(guest_id) | SET NULL | CASCADE |

**Cascade Rules:**
- `CASCADE`: Responses deleted with ticket
- `SET NULL`: Author info removed if user/guest deleted

### audit_log
| Foreign Key | References | On Delete | On Update |
|-------------|------------|-----------|-----------|
| user_id | users(user_id) | SET NULL | CASCADE |

**Cascade Rules:**
- `SET NULL`: Log remains if user deleted

---

## Cascade Rules

### DELETE CASCADE
**Meaning:** When parent deleted, children automatically deleted

**Used For:**
- `hotel_branches` → `rooms`: Branch closure removes all rooms
- `bookings` → `service_usage`: Cancelled booking removes services
- `bookings` → `payments`: Cancelled booking removes payments
- `support_tickets` → `ticket_responses`: Closed ticket removes responses

**Business Logic:** Dependent data has no meaning without parent

### DELETE RESTRICT
**Meaning:** Cannot delete parent if children exist

**Used For:**
- `guests` → `bookings`: Cannot delete guest with bookings
- `rooms` → `bookings`: Cannot delete room with bookings
- `room_types` → `rooms`: Cannot delete type with rooms

**Business Logic:** Protects critical business data

### DELETE SET NULL
**Meaning:** When parent deleted, foreign key set to NULL

**Used For:**
- `users` → `bookings.created_by`: Staff deleted, booking remains
- `users` → `payments.processed_by`: Staff deleted, payment remains
- `users` → `guests.user_id`: Account deleted, guest profile remains

**Business Logic:** Historical data preserved, relationship optional

---

## Relationship Details

### 1. Branch → Rooms (1:N)
**Type:** One-to-Many  
**Cardinality:** 1 branch : 0..* rooms  
**Cascade:** DELETE CASCADE

**Business Rule:**
- Each room belongs to exactly one branch
- Branch can have multiple rooms
- Deleting branch removes all its rooms

**Query Example:**
```sql
-- Get all rooms in a branch
SELECT r.* FROM rooms r
WHERE r.branch_id = 1;
```

---

### 2. Room Type → Rooms (1:N)
**Type:** One-to-Many  
**Cardinality:** 1 room_type : 0..* rooms  
**Cascade:** DELETE RESTRICT

**Business Rule:**
- Each room has exactly one type
- Type can be used by multiple rooms
- Cannot delete type if rooms exist

**Query Example:**
```sql
-- Get all deluxe rooms
SELECT r.* FROM rooms r
JOIN room_types rt ON r.room_type_id = rt.room_type_id
WHERE rt.type_name = 'Deluxe Double';
```

---

### 3. Guest → Bookings (1:N)
**Type:** One-to-Many  
**Cardinality:** 1 guest : 0..* bookings  
**Cascade:** DELETE RESTRICT

**Business Rule:**
- Each booking belongs to one guest
- Guest can have multiple bookings
- Cannot delete guest with bookings

**Query Example:**
```sql
-- Get guest's booking history
SELECT b.* FROM bookings b
WHERE b.guest_id = 1
ORDER BY b.booking_date DESC;
```

---

### 4. Booking → Service Usage (1:N)
**Type:** One-to-Many  
**Cardinality:** 1 booking : 0..* service_usage  
**Cascade:** DELETE CASCADE

**Business Rule:**
- Each service usage belongs to one booking
- Booking can have multiple services
- Deleting booking removes all services

**Query Example:**
```sql
-- Get all services for a booking
SELECT su.*, sc.service_name 
FROM service_usage su
JOIN service_catalogue sc ON su.service_id = sc.service_id
WHERE su.booking_id = 1001;
```

---

### 5. Booking → Payments (1:N)
**Type:** One-to-Many  
**Cardinality:** 1 booking : 0..* payments  
**Cascade:** DELETE CASCADE

**Business Rule:**
- Each payment belongs to one booking
- Booking can have multiple payments (partial payments)
- Deleting booking removes all payments

**Query Example:**
```sql
-- Get payment history for booking
SELECT p.* FROM payments p
WHERE p.booking_id = 1001
ORDER BY p.payment_date;
```

---

### 6. Branch ↔ Services (N:M via branch_services)
**Type:** Many-to-Many  
**Cardinality:** * branches : * services  
**Junction Table:** branch_services

**Business Rule:**
- Services available at multiple branches
- Branches offer multiple services
- Custom pricing per branch

**Query Example:**
```sql
-- Get services available at a branch
SELECT sc.*, bs.custom_price
FROM service_catalogue sc
JOIN branch_services bs ON sc.service_id = bs.service_id
WHERE bs.branch_id = 1 AND bs.is_available = TRUE;
```

---

### 7. User → Guest (1:1 Optional)
**Type:** One-to-One  
**Cardinality:** 1 user : 0..1 guest  
**Cascade:** DELETE SET NULL

**Business Rule:**
- Guest can have optional user account
- User account enables self-service portal
- Guest profile exists independently

**Query Example:**
```sql
-- Get guest with user account
SELECT g.*, u.username, u.email
FROM guests g
LEFT JOIN users u ON g.user_id = u.user_id
WHERE g.guest_id = 1;
```

---

### 8. Support Ticket → Responses (1:N)
**Type:** One-to-Many  
**Cardinality:** 1 ticket : 0..* responses  
**Cascade:** DELETE CASCADE

**Business Rule:**
- Each response belongs to one ticket
- Ticket can have multiple responses
- Deleting ticket removes all responses

**Query Example:**
```sql
-- Get ticket conversation
SELECT tr.*, u.full_name as staff_name, g.first_name as guest_name
FROM ticket_responses tr
LEFT JOIN users u ON tr.user_id = u.user_id
LEFT JOIN guests g ON tr.guest_id = g.guest_id
WHERE tr.ticket_id = 101
ORDER BY tr.created_at;
```

---

## 🎯 Key Takeaways

### Data Integrity
- ✅ **25+ Foreign Keys** enforce referential integrity
- ✅ **Cascade Rules** prevent orphaned records
- ✅ **RESTRICT** protects critical business data
- ✅ **SET NULL** preserves historical records

### Performance
- ✅ **Indexed Foreign Keys** for fast joins
- ✅ **Composite Indexes** for complex queries
- ✅ **Views** pre-join related data

### Business Logic
- ✅ **Double Booking Prevention** via triggers
- ✅ **Automatic Updates** via cascades
- ✅ **Data Consistency** via constraints
- ✅ **Audit Trail** via relationships

---

## 📊 Relationship Statistics

- **Total Foreign Keys:** 25+
- **One-to-Many Relationships:** 20+
- **One-to-One Relationships:** 1
- **Many-to-Many Relationships:** 1
- **CASCADE Rules:** 15+
- **RESTRICT Rules:** 5+
- **SET NULL Rules:** 10+

---

**Complete Database Documentation:**
- [DATABASE_TABLES.md](./DATABASE_TABLES.md) - Table structures
- [DATABASE_PROCEDURES.md](./DATABASE_PROCEDURES.md) - Stored procedures
- [DATABASE_TRIGGERS.md](./DATABASE_TRIGGERS.md) - Triggers and views
- [DATABASE_RELATIONSHIPS.md](./DATABASE_RELATIONSHIPS.md) - This document
