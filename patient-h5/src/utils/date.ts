const periodNames:Record<string,string>={morning:"上午",afternoon:"下午",evening:"晚上",custom:"其他",am:"上午",pm:"下午"};

export function formatVisitDate(value?:string|null,period?:string|null){
  if(!value)return"日期待定";
  const match=String(value).match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if(!match)return"日期待定";
  const part=periodNames[String(period??"").toLowerCase()]||period||"";
  return`${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日${part?` ${part}`:""}`;
}
