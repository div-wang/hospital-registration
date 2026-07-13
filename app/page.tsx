"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import Activity from "lucide-react/dist/esm/icons/activity";
import Baby from "lucide-react/dist/esm/icons/baby";
import Bell from "lucide-react/dist/esm/icons/bell";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import CalendarPlus from "lucide-react/dist/esm/icons/calendar-plus";
import CheckCircle2 from "lucide-react/dist/esm/icons/circle-check";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import CircleHelp from "lucide-react/dist/esm/icons/circle-help";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import Clock3 from "lucide-react/dist/esm/icons/clock-3";
import Ellipsis from "lucide-react/dist/esm/icons/ellipsis";
import FileSearch from "lucide-react/dist/esm/icons/file-search";
import FileText from "lucide-react/dist/esm/icons/file-text";
import HandHeart from "lucide-react/dist/esm/icons/hand-heart";
import HeartPulse from "lucide-react/dist/esm/icons/heart-pulse";
import HomeIcon from "lucide-react/dist/esm/icons/house";
import Hospital from "lucide-react/dist/esm/icons/hospital";
import Leaf from "lucide-react/dist/esm/icons/leaf";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import MessageCircleQuestion from "lucide-react/dist/esm/icons/message-circle-question-mark";
import Plus from "lucide-react/dist/esm/icons/plus";
import Search from "lucide-react/dist/esm/icons/search";
import ShieldPlus from "lucide-react/dist/esm/icons/shield-plus";
import Smile from "lucide-react/dist/esm/icons/smile";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Star from "lucide-react/dist/esm/icons/star";
import Stethoscope from "lucide-react/dist/esm/icons/stethoscope";
import UserRound from "lucide-react/dist/esm/icons/circle-user-round";
import VenusAndMars from "lucide-react/dist/esm/icons/venus-and-mars";

type Tab = "home" | "guide" | "orders" | "profile";
type Dept = { name: string; icon: LucideIcon; tone: string };

const departments: Dept[] = [
  { name: "内科", icon: HeartPulse, tone: "mint" },
  { name: "外科", icon: Stethoscope, tone: "blue" },
  { name: "妇产科", icon: VenusAndMars, tone: "pink" },
  { name: "儿科", icon: Baby, tone: "yellow" },
  { name: "皮肤科", icon: HandHeart, tone: "purple" },
  { name: "中医科", icon: Leaf, tone: "orange" },
  { name: "口腔科", icon: Smile, tone: "cyan" },
  { name: "更多科室", icon: Ellipsis, tone: "gray" },
];

const doctors = [
  { name: "涂平", title: "主任医师", hospital: "北京大学第一医院", dept: "皮肤科", skill: "皮炎、湿疹、荨麻疹、银屑病及疑难皮肤病", fee: 60, rating: "99%", years: "30年", avatar: "涂" },
  { name: "翁亚琴", title: "主任医师", hospital: "北京大学第六医院", dept: "精神科", skill: "抑郁症、焦虑症、睡眠障碍及情绪管理", fee: 50, rating: "98%", years: "28年", avatar: "翁" },
  { name: "史季桐", title: "主任医师", hospital: "北京同仁医院", dept: "眼科", skill: "眼部肿瘤、眼底病的诊断与治疗", fee: 100, rating: "99%", years: "32年", avatar: "史" },
];

const hospitals = [
  { name: "北京协和医院", level: "三甲", distance: "2.4km", focus: "综合 · 内科", color: "#2f80ed" },
  { name: "北京大学第一医院", level: "三甲", distance: "3.1km", focus: "皮肤 · 儿科", color: "#12a87a" },
  { name: "北京同仁医院", level: "三甲", distance: "4.8km", focus: "眼科 · 耳鼻喉", color: "#6956e8" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("home");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("全部");
  const [booking, setBooking] = useState<(typeof doctors)[number] | null>(null);
  const [toast, setToast] = useState("");

  const filteredDoctors = useMemo(() => doctors.filter(d => selectedDept === "全部" || d.dept === selectedDept), [selectedDept]);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2200); };

  return (
    <main className="app-shell">
      <div className="phone">
        <header className="topbar">
          <button className="city" aria-label="选择城市"><MapPin size={16}/>北京 <ChevronDown size={14}/></button>
          <div className="brand"><span className="brand-mark"><ShieldPlus size={17}/></span><b>安康挂号</b></div>
          <button className="message" aria-label="消息" onClick={() => notify("暂时没有新消息")}><Bell size={22}/><i /></button>
        </header>

        {tab === "home" && <>
          <section className="hero">
            <p className="eyebrow">专业医疗 · 安心预约</p>
            <h1>看病不迷路<br/><em>挂号更简单</em></h1>
            <p className="hero-copy">覆盖北京 260+ 家医院，实时号源一站查询</p>
            <button className="search" onClick={() => setSearchOpen(true)}><Search size={19}/><span>搜索医院、科室、医生或疾病</span></button>
            <div className="hero-art" aria-hidden="true"><div className="cross"><ShieldPlus/></div><div className="pulse"><Activity/></div></div>
          </section>

          <section className="quick-grid">
            <button onClick={() => { setSelectedDept("全部"); setTab("guide"); }}><span className="quick-icon blue"><Hospital/></span><b>按医院挂号</b><small>查看附近医院</small></button>
            <button onClick={() => setTab("guide")}><span className="quick-icon green"><Stethoscope/></span><b>按医生挂号</b><small>匹配专业医生</small></button>
            <button onClick={() => { setSelectedDept("内科"); setTab("guide"); }}><span className="quick-icon violet"><Sparkles/></span><b>智能导诊</b><small>症状自查推荐</small></button>
            <button onClick={() => setTab("orders")}><span className="quick-icon orange"><FileSearch/></span><b>报告查询</b><small>检查结果随时看</small></button>
          </section>

          <section className="section department-section">
            <div className="section-head"><div><p>快速预约</p><h2>热门科室</h2></div><button onClick={() => setTab("guide")}>全部科室 <ChevronRight/></button></div>
            <div className="dept-grid">
              {departments.map(d => { const DeptIcon = d.icon; return <button key={d.name} onClick={() => { if(d.name !== "更多科室") setSelectedDept(d.name); setTab("guide"); }}><span className={`dept-icon ${d.tone}`}><DeptIcon/></span><b>{d.name}</b></button>; })}
            </div>
          </section>

          <section className="section hospital-section">
            <div className="section-head"><div><p>优质资源</p><h2>附近好医院</h2></div><button onClick={() => setTab("guide")}>查看全部 <ChevronRight/></button></div>
            <div className="hospital-scroll">
              {hospitals.map(h => <button className="hospital-card" key={h.name} onClick={() => { setTab("guide"); notify(`已选择${h.name}`); }}><span className="hospital-logo" style={{background:h.color}}><Building2/></span><div><h3>{h.name}</h3><p><i>{h.level}</i>{h.focus}</p><small>可约号源 · {h.distance}</small></div><ChevronRight className="arrow"/></button>)}
            </div>
          </section>

          <section className="health-card">
            <div><span>今日健康贴士</span><h3>春夏交替，注意过敏防护</h3><p>花粉季外出建议佩戴口罩，回家后及时清洁面部。</p></div><div className="leaf"><Leaf/></div>
          </section>
        </>}

        {tab === "guide" && <section className="subpage">
          <div className="page-title"><button onClick={() => setTab("home")}><ChevronLeft/></button><h1>预约挂号</h1><span /></div>
          <button className="search light" onClick={() => setSearchOpen(true)}><Search size={18}/><span>搜索疾病、科室、医生、医院</span></button>
          <div className="segmented"><button className="active">找医生</button><button onClick={() => notify("已切换为医院视图")}>找医院</button></div>
          <div className="filter-row"><button>北京市<ChevronDown/></button><button>{selectedDept === "全部" ? "全部科室" : selectedDept}<ChevronDown/></button><button>综合排序<ChevronDown/></button></div>
          <div className="chips"><button className={selectedDept === "全部" ? "active" : ""} onClick={() => setSelectedDept("全部")}>全部</button>{["内科","皮肤科","精神科","眼科"].map(x => <button className={selectedDept === x ? "active" : ""} key={x} onClick={() => setSelectedDept(x)}>{x}</button>)}</div>
          <div className="doctor-list">
            {filteredDoctors.length ? filteredDoctors.map(d => <article className="doctor-card" key={d.name}><div className="avatar">{d.avatar}<span>医</span></div><div className="doctor-info"><div className="doctor-name"><h3>{d.name}</h3><span>{d.title}</span><i>专家</i></div><p className="hospital-name">{d.hospital} · {d.dept}</p><p className="skill"><b>擅长：</b>{d.skill}</p><div className="stats"><span><b>{d.rating}</b> 好评</span><span><b>{d.years}</b> 经验</span><span>今日有号</span></div><div className="doctor-action"><strong>¥{d.fee}<small> 起</small></strong><button onClick={() => setBooking(d)}>立即预约</button></div></div></article>) : <div className="empty"><Search/><h3>该科室暂无推荐医生</h3><button onClick={() => setSelectedDept("全部")}>查看全部医生</button></div>}
          </div>
        </section>}

        {tab === "orders" && <section className="subpage orders-page">
          <div className="page-title"><span/><h1>我的预约</h1><button onClick={() => notify("已打开帮助中心")}><CircleHelp/></button></div>
          <div className="order-tabs"><button className="active">待就诊</button><button>已完成</button><button>已取消</button></div>
          <article className="appointment"><div className="appointment-top"><span className="date-box"><b>16</b><small>7月</small></span><div><i>待就诊</i><h3>北京大学第一医院</h3><p>皮肤科 · 涂平 主任医师</p></div></div><div className="appointment-time"><span><Clock3/></span><div><small>就诊时间</small><b>周四 08:30 - 09:00</b></div></div><div className="appointment-actions"><button onClick={() => notify("路线已为你规划")}>查看路线</button><button onClick={() => notify("取号二维码已准备")}>就诊凭证</button></div></article>
          <div className="order-tip"><span>i</span><p><b>就诊提醒</b><br/>请携带身份证与医保卡，建议提前 30 分钟到院取号。</p></div>
        </section>}

        {tab === "profile" && <section className="subpage profile-page">
          <div className="profile-hero"><div className="profile-avatar">安</div><div><h2>安心用户</h2><p>已实名认证 · 北京市</p></div><button onClick={() => notify("资料编辑功能已打开")}>编辑资料</button></div>
          <div className="family"><div className="section-head"><div><p>就诊管理</p><h2>我的就诊人</h2></div><button onClick={() => notify("可以添加新的就诊人")}>添加 <Plus/></button></div><div className="family-person"><span>安</span><div><b>安先生</b><small>本人 · 已绑定医保</small></div><i>默认</i></div></div>
          <div className="menu-list">{[[FileText,"我的报告"],[Star,"收藏医生"],[HeartPulse,"健康档案"],[MapPin,"地址管理"],[MessageCircleQuestion,"帮助与客服"]].map(([MenuIcon,label]) => { const Icon = MenuIcon as LucideIcon; const text = label as string; return <button key={text} onClick={() => notify(`${text}功能已打开`)}><span><Icon/></span><b>{text}</b><ChevronRight/></button>; })}</div>
        </section>}

        <nav className="bottom-nav">
          {[{id:"home",icon:HomeIcon,label:"首页"},{id:"guide",icon:CalendarPlus,label:"挂号"},{id:"orders",icon:ClipboardList,label:"预约"},{id:"profile",icon:UserRound,label:"我的"}].map(item => { const NavIcon = item.icon; return <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id as Tab)}><span><NavIcon/></span><small>{item.label}</small></button>; })}
        </nav>

        {searchOpen && <div className="modal-backdrop" onClick={() => setSearchOpen(false)}><div className="search-modal" onClick={e => e.stopPropagation()}><div className="modal-handle"/><div className="modal-search"><Search/><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索医院、科室、医生或疾病"/><button onClick={() => setSearchOpen(false)}>取消</button></div><h3>热门搜索</h3><div className="hot-search">{["北京协和医院","皮肤科","儿童发热","睡眠障碍","口腔科"].map(x => <button key={x} onClick={() => {setQuery(x); notify(`正在搜索“${x}”`); setSearchOpen(false);}}>{x}</button>)}</div></div></div>}

        {booking && <div className="modal-backdrop" onClick={() => setBooking(null)}><div className="booking-sheet" onClick={e => e.stopPropagation()}><div className="modal-handle"/><div className="booking-doctor"><div className="avatar small">{booking.avatar}</div><div><h3>{booking.name} <span>{booking.title}</span></h3><p>{booking.hospital} · {booking.dept}</p></div></div><h3>选择就诊日期</h3><div className="date-list">{["今天\n约满","明天\n¥60","7月13日\n¥60","7月14日\n¥60"].map((x,i) => <button key={x} disabled={i===0} className={i===1 ? "active":""}>{x.split("\n").map(t=><span key={t}>{t}</span>)}</button>)}</div><div className="fee-line"><span>挂号费用</span><b>¥{booking.fee}</b></div><button className="confirm" onClick={() => {setBooking(null); setTab("orders"); notify("预约信息已提交，请确认就诊人");}}>确认预约</button></div></div>}

        {toast && <div className="toast"><CheckCircle2/> {toast}</div>}
      </div>
    </main>
  );
}
