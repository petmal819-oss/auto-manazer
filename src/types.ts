export type Car = {
  id: string;
  userId?: string;
  plate: string; // EČV / SPZ
  make: string;
  model: string;
  year: number;
  color?: string;
  vin?: string;
  engineCapacity?: number; // in cm3
  powerKw?: number; // in kW
  photo?: string | string[]; // base64
  registrationCard?: string | string[]; // base64
  stkEkCard?: string | string[]; // base64
  stkValidTo?: string; // YYYY-MM-DD
  whiteCardPhoto?: string | string[]; // base64
  insuranceValidTo?: string; // YYYY-MM-DD
  insuranceCompany?: string; // Poisťovňa
  insurancePolicyNumber?: string; // Číslo poistky
};

export type ServiceRecord = {
  id: string;
  userId?: string;
  carId: string;
  date: string; // YYYY-MM-DD
  description: string;
  cost: number;
  mileage: number;
  notes?: string;
  photo?: string | string[]; // base64
  isRecurring?: boolean;
  recurringMonthsInterval?: number;
  recurringMileageInterval?: number;
  nextServiceDate?: string; // YYYY-MM-DD
  nextServiceMileage?: number;
};

export type Vignette = {
  id: string;
  userId?: string;
  carId: string;
  country: string; // e.g., 'Slovensko', 'Česko', 'Rakúsko'
  type: '10-dňová' | '30-dňová' | '365-dňová' | 'Ročná';
  validFrom: string;
  validTo: string;
};

export type Refueling = {
  id: string;
  userId?: string;
  carId: string;
  date: string; // YYYY-MM-DD
  pricePerLiter: number;
  totalCost: number;
  mileage: number;
  liters?: number;
  averageConsumption?: number;
};

export type AppData = {
  cars: Car[];
  services: ServiceRecord[];
  vignettes: Vignette[];
  refuelings: Refueling[];
};
