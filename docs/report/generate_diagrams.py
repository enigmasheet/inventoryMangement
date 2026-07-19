import subprocess
import os
import tempfile

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "figures")
os.makedirs(OUTPUT_DIR, exist_ok=True)

MERMAID_CLI = "npx -y @mermaid-js/mermaid-cli"


def render(mermaid_code: str, filename: str, width: int = 900, height: int = 700):
    path = os.path.join(OUTPUT_DIR, filename)
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".mmd", delete=False, encoding="utf-8"
    ) as f:
        f.write(mermaid_code)
        tmp = f.name
    try:
        subprocess.run(
            f'{MERMAID_CLI} -i "{tmp}" -o "{path}" -w {width} -H {height}',
            shell=True,
            check=True,
            capture_output=True,
            text=True,
        )
        print(f"  OK  {filename}")
    except subprocess.CalledProcessError as e:
        print(f"FAIL  {filename}\n{e.stderr}")
    finally:
        os.unlink(tmp)


# ── Figure 1: System Architecture Diagram ──────────────────────────────────

ARCHITECTURE = """graph TD
  subgraph Client["Client Layer (Browser)"]
    RSC["React Server Components"]
    CC["React Client Components"]
  end

  subgraph Server["Next.js 16 Server (App Router)"]
    P["proxy.ts<br/><i>Layer 1: Auth Redirect</i>"]
    LG["Layout Guard<br/><i>Layer 2: Tenant Membership</i>"]
    SA["Server Actions<br/><i>Layer 3: Query Scoping</i>"]
    API["API Routes<br/><i>Better Auth Handler</i>"]
  end

  subgraph Data["Data Layer"]
    PRA["Prisma ORM<br/><i>Driver Adapter</i>"]
    PG[("PostgreSQL 17<br/><i>Neon Cloud</i>")]
  end

  RSC --> P
  CC --> P
  P --> LG
  LG --> SA
  LG --> API
  SA --> PRA
  API --> PRA
  PRA --> PG

  style Client fill:#e1f5fe
  style Server fill:#fff3e0
  style Data fill:#e8f5e9
"""

# ── Figure 2: DFD Level 0 (Context) ────────────────────────────────────────

DFD_L0 = """graph LR
  subgraph System["Sajilo Inventory System"]
    SYS("0.0<br/>Inventory<br/>Management<br/>System")
  end

  O(("Shop Owner"))
  S(("Staff"))
  G(("Google OAuth"))
  DB[("Database")]

  O -- "Login / Manage Products /<br/>Record Movement / Reports" --> SYS
  S -- "Login / Record Movement" --> SYS
  G -- "Authentication Tokens" --> SYS
  SYS -- "Queries / Updates" --> DB
  DB -- "Results" --> SYS
  SYS -- "Auth Requests" --> G

  style System fill:#fff3e0,stroke:#e65100
  style O fill:#e1f5fe
  style S fill:#e1f5fe
  style G fill:#fce4ec
  style DB fill:#e8f5e9
"""

# ── Figure 3: DFD Level 1 ──────────────────────────────────────────────────

DFD_L1 = """graph TD
  subgraph Sys["Sajilo Inventory System"]
    P1["1.0<br/>Authenticate"]
    P2["2.0<br/>Manage Products"]
    P3["3.0<br/>Record Stock Movement"]
    P4["4.0<br/>Perform Stock Take"]
    P5["5.0<br/>View Dashboard"]
  end

  O(("Owner"))
  S(("Staff"))
  G(("Google OAuth"))
  D1[("User Store")]
  D2[("Product Store")]
  D3[("Movement Store")]
  D4[("Stock Take Store")]

  O --> P1
  S --> P1
  G --> P1
  P1 --> D1

  O --> P2
  S --> P2
  P2 --> D2

  O --> P3
  S --> P3
  P3 --> D2
  P3 --> D3

  O --> P4
  P4 --> D2
  P4 --> D4

  O --> P5
  P5 --> D1
  P5 --> D2
  P5 --> D3

  style Sys fill:#fff3e0,stroke:#e65100
  style O fill:#e1f5fe
  style S fill:#e1f5fe
  style G fill:#fce4ec
  style D1,D2,D3,D4 fill:#e8f5e9
"""

# ── Figure 4: Entity-Relationship Diagram ──────────────────────────────────

ER_DIAGRAM = """erDiagram
  Tenant ||--o{ User : "has members"
  Tenant ||--o{ Product : "owns"
  Tenant ||--o{ AttributeDefinition : "defines"
  Tenant ||--o{ StockMovement : "records"
  Tenant ||--o{ StockTake : "performs"
  User ||--o{ Session : "has"
  User ||--o{ Account : "has"
  User ||--o{ Tenant : "created"
  AttributeDefinition ||--o{ ProductAttributeValue : "typed by"
  Product ||--o{ ProductAttributeValue : "has"
  Product ||--o{ StockMovement : "involved in"
  Product ||--o{ StockTakeItem : "counted in"
  StockTake ||--o{ StockTakeItem : "contains"

  Tenant {
    String id PK
    String slug UK
    String shopName
    String category
    String currency
    String inviteCode UK
  }
  User {
    String id PK
    String email UK
    String name
    String tenantId FK
  }
  Product {
    String id PK
    String tenantId FK
    String name
    String sku UK
    Decimal unitPrice
    Decimal costPrice
    Int quantity
    Int lowStockLimit
  }
  AttributeDefinition {
    String id PK
    String tenantId FK
    String key
    String label
    String type
  }
  ProductAttributeValue {
    String id PK
    String productId FK
    String attributeDefId FK
    String value
  }
  StockMovement {
    String id PK
    String tenantId FK
    String productId FK
    String type
    Int quantity
    String note
  }
  StockTake {
    String id PK
    String tenantId FK
    String status
    String note
  }
  StockTakeItem {
    String id PK
    String stockTakeId FK
    String productId FK
    Int expectedQuantity
    Int countedQuantity
  }
"""

# ── Figure 5: UML Use Case Diagram ─────────────────────────────────────────

USECASE = """graph TB
  subgraph System["Sajilo Inventory"]
    UC1("Authenticate via Google OAuth")
    UC2("Manage Product Catalog")
    UC3("Record Stock Movement")
    UC4("Perform Stock Take")
    UC5("View Dashboard")
    UC6("Export Data to CSV")
    UC7("Manage Custom Attributes")
    UC8("Configure Low-Stock Alerts")
  end

  Owner(["Owner"])
  Staff(["Staff"])
  Visitor(["Visitor"])

  Owner --> UC1
  Owner --> UC2
  Owner --> UC3
  Owner --> UC4
  Owner --> UC5
  Owner --> UC6
  Owner --> UC7
  Owner --> UC8

  Staff --> UC1
  Staff --> UC2
  Staff --> UC3

  Visitor --> UC1

  style Owner fill:#e1f5fe,stroke:#0288d1
  style Staff fill:#fff9c4,stroke:#fbc02d
  style Visitor fill:#fce4ec,stroke:#c62828
  style System fill:#fff3e0,stroke:#e65100
"""

# ── Figure 6: UML Class Diagram ────────────────────────────────────────────

CLASS_DIAGRAM = """classDiagram
  class Tenant {
    +String id
    +String slug
    +String shopName
    +String category
    +String currency
    +String inviteCode
    +addUser()
    +createProduct()
  }

  class User {
    +String id
    +String email
    +String name
    +String tenantId
    +login()
  }

  class Product {
    +String id
    +String name
    +String sku
    +Decimal unitPrice
    +Decimal costPrice
    +Int quantity
    +Int lowStockLimit
    +updateStock(quantity)
  }

  class AttributeDefinition {
    +String id
    +String key
    +String label
    +String type
  }

  class ProductAttributeValue {
    +String id
    +String value
  }

  class StockMovement {
    +String id
    +String type
    +Int quantity
    +String note
    +DateTime createdAt
  }

  class StockTake {
    +String id
    +String status
    +String note
    +DateTime createdAt
    +complete()
  }

  class StockTakeItem {
    +String id
    +Int expectedQuantity
    +Int countedQuantity
  }

  Tenant "1" --> "*" User : has
  Tenant "1" --> "*" Product : owns
  Tenant "1" --> "*" AttributeDefinition : defines
  Tenant "1" --> "*" StockMovement : records
  Tenant "1" --> "*" StockTake : performs
  Product "1" --> "*" ProductAttributeValue : has
  AttributeDefinition "1" --> "*" ProductAttributeValue : types
  Product "1" --> "*" StockMovement : involved in
  StockTake "1" --> "*" StockTakeItem : contains
  Product "1" --> "*" StockTakeItem : counted in
"""

# ── Figure 7: UML Sequence Diagram — Stock Movement ───────────────────────

SEQUENCE = """sequenceDiagram
  actor User
  participant SA as Server Action
  participant P as Product
  participant SM as StockMovement
  participant DB as Database

  User->>SA: Submit stock movement form<br/>(type, quantity, note)
  activate SA
  SA->>SA: Validate input with Zod schema
  alt Validation fails
    SA-->>User: Return error toast
  else Validation passes
    SA->>SA: Get session (tenantId)
    SA->>P: findFirst({ id, tenantId })
    activate P
    P-->>SA: Product or null
    deactivate P
    alt Product not found
      SA-->>User: Return "Not found" error
    else Product found
      SA->>DB: $transaction
      activate DB
      DB->>P: Update quantity
      DB->>SM: Create movement record
      DB-->>SA: Transaction result
      deactivate DB
      SA->>SA: revalidatePath()
      SA-->>User: Return success / redirect
    end
  end
  deactivate SA
"""

# ── Gantt Chart (6 weeks) ──────────────────────────────────────────────────

GANTT = """gantt
  title Project Timeline (6 Weeks)
  dateFormat  YYYY-MM-DD
  axisFormat  %b %d

  section Analysis
  Requirement Analysis        :a1, 2026-06-01, 7d

  section Design
  System Design               :a2, after a1, 7d

  section Implementation
  Backend (Auth + Products)   :a3, after a2, 7d
  Stock + Dashboard           :a4, after a3, 7d

  section Testing
  Testing & Debugging         :a5, after a4, 7d

  section Documentation
  Docs & Final Submission     :a6, after a5, 7d
"""


# ── RUN ALL ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("Generating diagrams...")
    render(ARCHITECTURE, "figure_01_architecture.png", 800, 600)
    render(DFD_L0, "figure_02_dfd_l0.png", 700, 500)
    render(DFD_L1, "figure_03_dfd_l1.png", 800, 600)
    render(ER_DIAGRAM, "figure_04_er_diagram.png", 1000, 800)
    render(USECASE, "figure_05_usecase.png", 700, 600)
    render(CLASS_DIAGRAM, "figure_06_class_diagram.png", 900, 700)
    render(SEQUENCE, "figure_07_sequence.png", 800, 600)
    render(GANTT, "figure_08_gantt.png", 900, 400)
    print(f"\nAll diagrams saved to: {OUTPUT_DIR}")
