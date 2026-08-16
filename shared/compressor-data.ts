export type CompressorModel = {
  brand: string;
  model: string;
  horsepower: string;
  watts: string;
  frequencyHz: string;
  rla: string;
  displacementCc: string;
  coolingKcalHr: string;
  coolingBtuHr: string;
  capacityMinus23C: string;
  capacityMinus5C: string;
  capacityPlus7C: string;
  application: string;
  refrigerant: string;
  notes: string;
  oilOrCapacitor: string;
};

export const compressorModels: CompressorModel[] = [
  {
    brand: "عام",
    model: "بيانات الجهاز من لوحة الاسم",
    horsepower: "—",
    watts: "—",
    frequencyHz: "50/60",
    rla: "—",
    displacementCc: "—",
    coolingKcalHr: "—",
    coolingBtuHr: "—",
    capacityMinus23C: "—",
    capacityMinus5C: "—",
    capacityPlus7C: "—",
    application: "مرجع إدخال بيانات الكباس",
    refrigerant: "حسب اللوحة",
    notes: "استخدم بيانات الشركة المصنعة عند المطابقة النهائية.",
    oilOrCapacitor: "حسب الموديل",
  },
];
