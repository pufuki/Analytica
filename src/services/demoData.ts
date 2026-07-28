import type { DemoDataset } from '@/types';

// Deterministic PRNG (mulberry32) so datasets are identical every run.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function csvEscape(v: string | number): string {
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowToCsv(headers: string[], row: (string | number)[]): string {
  return row.map(csvEscape).join(',');
}

function buildCsv(headers: string[], rows: (string | number)[][]): string {
  return [headers.join(','), ...rows.map((r) => rowToCsv(headers, r))].join('\n');
}

// Inject controlled missingness, duplicates, and outliers into a dataset.
function injectImperfections(
  headers: string[],
  rows: (string | number)[][],
  rand: () => number,
  opts: { missingPct: number; dupPct: number; outlierCols: { idx: number; factor: number }[] },
): string {
  let work = rows.map((r) => [...r]);

  // missing values
  for (const row of work) {
    for (let i = 0; i < row.length; i++) {
      if (rand() < opts.missingPct) row[i] = '';
    }
  }

  // outliers
  for (const o of opts.outlierCols) {
    const n = work.length;
    const count = Math.max(1, Math.floor(n * 0.02));
    for (let k = 0; k < count; k++) {
      const idx = Math.floor(rand() * n);
      const val = Number(work[idx][o.idx]);
      if (Number.isFinite(val)) {
        work[idx][o.idx] = val * o.factor + (rand() - 0.5) * Math.abs(val);
      }
    }
  }

  // duplicates
  const dupCount = Math.floor(n_rows(work) * opts.dupPct);
  for (let k = 0; k < dupCount; k++) {
    const src = Math.floor(rand() * work.length);
    work.push([...work[src]]);
  }

  return buildCsv(headers, work);
}

function n_rows(work: (string | number)[][]): number {
  return work.length;
}

// ---- Dataset 1: Employee Performance ----
function genEmployee(): string {
  const rand = mulberry32(101);
  const depts = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'];
  const jobs: Record<string, string[]> = {
    Engineering: ['Junior Dev', 'Senior Dev', 'Tech Lead', 'Architect'],
    Sales: ['Sales Rep', 'Account Exec', 'Sales Manager'],
    Marketing: ['Coordinator', 'Specialist', 'Manager'],
    HR: ['Recruiter', 'Generalist', 'HR Manager'],
    Finance: ['Analyst', 'Accountant', 'Controller'],
    Operations: ['Analyst', 'Manager', 'Director'],
  };
  const edu = ['High School', 'Bachelor', 'Master', 'PhD'];
  const genders = ['M', 'F'];

  const headers = [
    'Employee_ID', 'Department', 'Job_Title', 'Age', 'Gender', 'Years_Experience',
    'Education', 'Monthly_Salary', 'Performance_Score', 'Projects_Completed',
    'Training_Hours', 'Attendance_Rate', 'Promotion', 'Resigned',
  ];

  const rows: (string | number)[][] = [];
  const n = 1200;
  for (let i = 0; i < n; i++) {
    const dept = depts[Math.floor(rand() * depts.length)];
    const jobList = jobs[dept];
    const job = jobList[Math.floor(rand() * jobList.length)];
    const age = Math.round(22 + rand() * 38);
    const gender = genders[Math.floor(rand() * genders.length)];
    const exp = Math.round(rand() * Math.min(age - 22, 30));
    const education = edu[Math.floor(rand() * edu.length)];
    // salary driven by experience + education + department
    const eduBonus = { 'High School': 0, Bachelor: 8000, Master: 15000, PhD: 22000 }[education] ?? 0;
    const deptBase = { Engineering: 60000, Sales: 50000, Marketing: 48000, HR: 45000, Finance: 55000, Operations: 47000 }[dept] ?? 50000;
    let salary = deptBase + exp * 2200 + eduBonus + (rand() - 0.5) * 8000;
    salary = Math.max(30000, Math.round(salary / 100) * 100);
    // performance driven by training + attendance + slight noise
    const training = Math.round(10 + rand() * 90);
    const attendance = Math.round((85 + rand() * 15) * 10) / 10;
    const perf = Math.min(100, Math.max(40, Math.round(50 + training * 0.2 + (attendance - 85) * 1.5 + (rand() - 0.5) * 15)));
    const projects = Math.round(2 + exp * 0.5 + perf * 0.05 + rand() * 5);
    // promotion if perf high and exp moderate
    const promotion = perf >= 80 && exp >= 3 && rand() > 0.3 ? 'Yes' : 'No';
    // resignation if low perf or low attendance
    const resigned = (perf < 60 || attendance < 88) && rand() < 0.15 ? 'Yes' : 'No';

    rows.push([
      `EMP${String(i + 1).padStart(5, '0')}`, dept, job, age, gender, exp, education,
      salary, perf, projects, training, attendance, promotion, resigned,
    ]);
  }

  return injectImperfections(headers, rows, rand, {
    missingPct: 0.02,
    dupPct: 0.01,
    outlierCols: [{ idx: 7, factor: 2.2 }, { idx: 8, factor: 1.5 }],
  });
}

// ---- Dataset 2: E-commerce Sales ----
function genEcommerce(): string {
  const rand = mulberry32(202);
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Diego'];
  const categories = ['Electronics', 'Clothing', 'Home', 'Books', 'Sports', 'Beauty'];
  const productNames: Record<string, string[]> = {
    Electronics: ['Wireless Earbuds', 'Smart Watch', 'USB Cable', 'Bluetooth Speaker'],
    Clothing: ['T-Shirt', 'Jeans', 'Hoodie', 'Sneakers'],
    Home: ['Lamp', 'Cookware Set', 'Bedding', 'Vacuum'],
    Books: ['Novel', 'Cookbook', 'Biography', 'Textbook'],
    Sports: ['Yoga Mat', 'Dumbbells', 'Bicycle', 'Running Shoes'],
    Beauty: ['Moisturizer', 'Perfume', 'Shampoo', 'Lipstick'],
  };
  const payments = ['Credit Card', 'PayPal', 'Bank Transfer', 'Cash on Delivery'];
  const genders = ['M', 'F'];

  const headers = [
    'Order_ID', 'Customer_ID', 'Age', 'Gender', 'City', 'Product_Category', 'Product_Name',
    'Quantity', 'Unit_Price', 'Discount', 'Payment_Method', 'Order_Date', 'Delivery_Days', 'Returned', 'Rating',
  ];

  const rows: (string | number)[][] = [];
  const n = 1800;
  const start = new Date('2023-01-01').getTime();
  for (let i = 0; i < n; i++) {
    const cat = categories[Math.floor(rand() * categories.length)];
    const prods = productNames[cat];
    const product = prods[Math.floor(rand() * prods.length)];
    const age = Math.round(18 + rand() * 55);
    const gender = genders[Math.floor(rand() * genders.length)];
    const city = cities[Math.floor(rand() * cities.length)];
    const qty = Math.round(1 + rand() * 4);
    const basePrice = { Electronics: 120, Clothing: 45, Home: 80, Books: 25, Sports: 60, Beauty: 35 }[cat] ?? 50;
    const unitPrice = Math.round((basePrice + (rand() - 0.5) * basePrice * 0.4) * 100) / 100;
    const discount = Math.round(rand() * 40 * 10) / 10; // 0-40%
    const payment = payments[Math.floor(rand() * payments.length)];
    const orderDate = new Date(start + Math.floor(rand() * 365 * 86400000)).toISOString().slice(0, 10);
    const deliveryDays = Math.round(1 + rand() * 9 + (discount > 20 ? 1 : 0));
    // higher discount -> higher return probability
    const returned = (discount > 25 && rand() < 0.3) || rand() < 0.08 ? 'Yes' : 'No';
    const rating = Math.round((2 + rand() * 3 - (returned === 'Yes' ? 1 : 0)) * 10) / 10;
    const clampedRating = Math.max(1, Math.min(5, rating));

    rows.push([
      `ORD${String(i + 1).padStart(6, '0')}`, `CUST${String(Math.floor(rand() * 800) + 1).padStart(5, '0')}`,
      age, gender, city, cat, product, qty, unitPrice, discount, payment, orderDate, deliveryDays, returned, clampedRating,
    ]);
  }

  return injectImperfections(headers, rows, rand, {
    missingPct: 0.015,
    dupPct: 0.012,
    outlierCols: [{ idx: 8, factor: 3 }, { idx: 12, factor: 2 }],
  });
}

// ---- Dataset 3: Hospital Patients ----
function genHospital(): string {
  const rand = mulberry32(303);
  const diseases = ['Hypertension', 'Diabetes', 'Asthma', 'Heart Disease', 'Flu', 'Arthritis', 'Migraine'];
  const genders = ['M', 'F'];

  const headers = [
    'Patient_ID', 'Age', 'Gender', 'Disease', 'Blood_Pressure', 'Heart_Rate', 'Cholesterol',
    'BMI', 'Smoking', 'Diabetes', 'Hospital_Stay_Days', 'Treatment_Cost', 'Readmitted',
  ];

  const rows: (string | number)[][] = [];
  const n = 1000;
  for (let i = 0; i < n; i++) {
    const age = Math.round(18 + rand() * 80);
    const gender = genders[Math.floor(rand() * genders.length)];
    const disease = diseases[Math.floor(rand() * diseases.length)];
    const smoking = rand() < 0.25 ? 'Yes' : 'No';
    const diabetic = disease === 'Diabetes' || rand() < 0.15 ? 'Yes' : 'No';
    // blood pressure driven by age + smoking
    const bp = Math.round(100 + age * 0.5 + (smoking === 'Yes' ? 10 : 0) + (rand() - 0.5) * 20);
    const hr = Math.round(65 + age * 0.1 + (smoking === 'Yes' ? 8 : 0) + (rand() - 0.5) * 15);
    // cholesterol driven by age + bmi
    const bmi = Math.round((20 + rand() * 15) * 10) / 10;
    const chol = Math.round(150 + age * 0.8 + (bmi - 25) * 3 + (rand() - 0.5) * 30);
    // treatment cost driven by stay + smoking + diabetes
    const stayDays = Math.round(1 + rand() * 14 + (smoking === 'Yes' ? 2 : 0) + (diabetic === 'Yes' ? 2 : 0));
    const cost = Math.round((500 + stayDays * 350 + (smoking === 'Yes' ? 800 : 0) + (diabetic === 'Yes' ? 1200 : 0) + (rand() - 0.5) * 500));
    // readmission if chronic
    const readmitted = (smoking === 'Yes' || diabetic === 'Yes' || stayDays > 7) && rand() < 0.25 ? 'Yes' : 'No';

    rows.push([
      `PAT${String(i + 1).padStart(5, '0')}`, age, gender, disease, bp, hr, chol, bmi,
      smoking, diabetic, stayDays, cost, readmitted,
    ]);
  }

  return injectImperfections(headers, rows, rand, {
    missingPct: 0.025,
    dupPct: 0.008,
    outlierCols: [{ idx: 11, factor: 2.5 }, { idx: 6, factor: 1.6 }],
  });
}

// ---- Dataset 4: Student Performance ----
function genStudent(): string {
  const rand = mulberry32(404);
  const edu = ['High School', 'Bachelor', 'Master', 'PhD'];
  const genders = ['M', 'F'];

  const headers = [
    'Student_ID', 'Age', 'Gender', 'Study_Hours', 'Attendance', 'Assignment_Score',
    'Midterm', 'Final_Exam', 'Internet_Access', 'Parental_Education', 'Extracurricular', 'Final_Grade', 'Passed',
  ];

  const rows: (string | number)[][] = [];
  const n = 900;
  for (let i = 0; i < n; i++) {
    const age = Math.round(15 + rand() * 8);
    const gender = genders[Math.floor(rand() * genders.length)];
    const study = Math.round((1 + rand() * 12) * 10) / 10;
    const attendance = Math.round((60 + rand() * 40) * 10) / 10;
    const internet = rand() < 0.85 ? 'Yes' : 'No';
    const parentEdu = edu[Math.floor(rand() * edu.length)];
    const extracurricular = rand() < 0.4 ? 'Yes' : 'No';
    // assignment score driven by study hours
    const assignment = Math.min(100, Math.max(40, Math.round(50 + study * 3 + (rand() - 0.5) * 15)));
    // midterm driven by study + attendance
    const midterm = Math.min(100, Math.max(35, Math.round(45 + study * 2.5 + (attendance - 80) * 0.5 + (rand() - 0.5) * 15)));
    // final exam driven by study + attendance + assignment + midterm
    const finalExam = Math.min(100, Math.max(30, Math.round(40 + study * 3 + (attendance - 80) * 0.6 + midterm * 0.2 + (rand() - 0.5) * 12)));
    const finalGrade = Math.round((assignment * 0.3 + midterm * 0.3 + finalExam * 0.4) * 10) / 10;
    const passed = finalGrade >= 60 ? 'Yes' : 'No';

    rows.push([
      `STU${String(i + 1).padStart(5, '0')}`, age, gender, study, attendance, assignment,
      midterm, finalExam, internet, parentEdu, extracurricular, finalGrade, passed,
    ]);
  }

  return injectImperfections(headers, rows, rand, {
    missingPct: 0.02,
    dupPct: 0.01,
    outlierCols: [{ idx: 3, factor: 2 }, { idx: 7, factor: 1.5 }],
  });
}

// ---- Dataset 5: Bank Loan Applications ----
function genBankLoan(): string {
  const rand = mulberry32(505);
  const employment = ['Employed', 'Self-Employed', 'Unemployed', 'Part-Time'];
  const homeOwner = ['Yes', 'No'];
  const marital = ['Single', 'Married', 'Divorced', 'Widowed'];

  const headers = [
    'Application_ID', 'Age', 'Income', 'Employment_Status', 'Credit_Score', 'Loan_Amount',
    'Loan_Term', 'Existing_Debt', 'Home_Owner', 'Marital_Status', 'Dependents', 'Approved', 'Defaulted',
  ];

  const rows: (string | number)[][] = [];
  const n = 1500;
  for (let i = 0; i < n; i++) {
    const age = Math.round(21 + rand() * 45);
    const emp = employment[Math.floor(rand() * employment.length)];
    // income driven by employment + age
    const empBase = { Employed: 60000, 'Self-Employed': 50000, Unemployed: 15000, 'Part-Time': 30000 }[emp] ?? 40000;
    const income = Math.max(10000, Math.round((empBase + age * 800 + (rand() - 0.5) * 20000) / 100) * 100);
    // credit score driven by income + employment
    const credit = Math.min(850, Math.max(400, Math.round(550 + income * 0.0008 + (emp === 'Unemployed' ? -80 : 0) + (rand() - 0.5) * 80)));
    const loanAmount = Math.round((5000 + rand() * 45000 + income * 0.1) / 100) * 100;
    const loanTerm = [12, 24, 36, 48, 60][Math.floor(rand() * 5)];
    const existingDebt = Math.round(rand() * income * 0.3);
    const home = homeOwner[Math.floor(rand() * homeOwner.length)];
    const maritalStatus = marital[Math.floor(rand() * marital.length)];
    const dependents = Math.round(rand() * 4);
    // approval driven by income + credit score - debt
    const approvalScore = income * 0.00002 + credit * 0.001 - existingDebt * 0.00005 + (home === 'Yes' ? 0.1 : 0);
    const approved = approvalScore > 0.7 || rand() > 0.35 ? 'Yes' : 'No';
    // default driven by low credit + high debt + unemployed
    const defaultScore = (credit < 600 ? 0.3 : 0) + (existingDebt > income * 0.2 ? 0.2 : 0) + (emp === 'Unemployed' ? 0.2 : 0);
    const defaulted = approved === 'Yes' && rand() < defaultScore ? 'Yes' : 'No';

    rows.push([
      `APP${String(i + 1).padStart(6, '0')}`, age, income, emp, credit, loanAmount,
      loanTerm, existingDebt, home, maritalStatus, dependents, approved, defaulted,
    ]);
  }

  return injectImperfections(headers, rows, rand, {
    missingPct: 0.018,
    dupPct: 0.01,
    outlierCols: [{ idx: 2, factor: 2.5 }, { idx: 5, factor: 2.2 }],
  });
}

// Pre-generate all demo datasets once (memoized).
let cached: DemoDataset[] | null = null;

export function getDemoDatasets(): DemoDataset[] {
  if (cached) return cached;
  cached = [
    {
      id: 'employees',
      name: 'Employee Performance',
      description: 'HR data with salary, performance scores, and attrition signals.',
      icon: 'Users',
      rows: 1200,
      columns: 14,
      csv: genEmployee(),
    },
    {
      id: 'ecommerce',
      name: 'E-commerce Sales',
      description: 'Retail orders with discounts, returns, and customer ratings.',
      icon: 'ShoppingCart',
      rows: 1800,
      columns: 15,
      csv: genEcommerce(),
    },
    {
      id: 'hospital',
      name: 'Hospital Patients',
      description: 'Patient records linking vitals, lifestyle, and treatment cost.',
      icon: 'HeartPulse',
      rows: 1000,
      columns: 13,
      csv: genHospital(),
    },
    {
      id: 'students',
      name: 'Student Performance',
      description: 'Academic records tying study habits to exam outcomes.',
      icon: 'GraduationCap',
      rows: 900,
      columns: 13,
      csv: genStudent(),
    },
    {
      id: 'loans',
      name: 'Bank Loan Applications',
      description: 'Lending data with credit scores, approvals, and defaults.',
      icon: 'Landmark',
      rows: 1500,
      columns: 13,
      csv: genBankLoan(),
    },
  ];
  return cached;
}
