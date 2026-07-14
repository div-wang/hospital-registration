<script setup lang="ts">
import{computed,onMounted,ref,watch}from"vue";
import{Search,MapPin,Building2,ChevronDown,ChevronRight}from"lucide-vue-next";
import{api,type Department,type Doctor,type Hospital}from"../api";
import PageHeader from"../components/PageHeader.vue";
const hospitals=ref<Hospital[]>([]),allHospitals=ref<Hospital[]>([]),departments=ref<Department[]>([]),departmentDoctors=ref<Doctor[]>([]),selectedDepartment=ref(""),keyword=ref(""),province=ref("北京市"),city=ref("北京市"),regionOpen=ref(false);
const departmentNames=computed(()=>[...new Set(departments.value.map(d=>d.name))]);
const provinces=computed(()=>[...new Set(allHospitals.value.map(h=>h.province))]);
const cities=computed(()=>[...new Set(allHospitals.value.filter(h=>h.province===province.value).map(h=>h.city))]);
const displayed=computed(()=>selectedDepartment.value?hospitals.value.filter(h=>departmentDoctors.value.some(d=>d.hospitalId===h.id)):hospitals.value);
async function load(){hospitals.value=await api.hospitals({keyword:keyword.value,province:province.value,city:city.value})}
async function selectDepartment(name=""){selectedDepartment.value=name;departmentDoctors.value=name?await api.doctors({department:name,pageSize:100}):[]}
function chooseRegion(p:string,c:string){province.value=p;city.value=c;regionOpen.value=false;void load()}
onMounted(async()=>{[allHospitals.value,departments.value]=await Promise.all([api.hospitals({}),api.departments()]);await load()});
let timer:number;watch(keyword,()=>{clearTimeout(timer);timer=window.setTimeout(load,250)});
</script>
<template><main><PageHeader title="找医院"/><div class="search-box hospital-search"><button class="search-region" @click="regionOpen=true"><MapPin/><span>{{city||province||'全国'}}</span><ChevronDown/></button><i></i><Search/><input v-model="keyword" placeholder="搜索医院、地区"/></div><div class="hospital-layout"><aside><button :class="{active:!selectedDepartment}" @click="selectDepartment()">全部科室</button><button v-for="d in departmentNames.slice(0,15)" :key="d" :class="{active:selectedDepartment===d}" @click="selectDepartment(d)">{{d}}</button></aside><section class="hospital-results"><article v-for="h in displayed" :key="h.id" @click="$router.push(`/hospitals/${h.id}`)"><span class="hospital-icon"><Building2/></span><div><h3>{{h.name}}</h3><p><i>{{h.level}}</i><i>{{h.type||'综合医院'}}</i></p><small>地址：{{h.city}}{{h.district}}{{h.address}}</small></div><ChevronRight/></article><div v-if="!displayed.length" class="empty">当前筛选条件下暂无医院</div></section></div><div v-if="regionOpen" class="overlay" @click.self="regionOpen=false"><section class="sheet filter-sheet"><i class="handle"/><h2>选择地区</h2><div class="option-grid"><button v-for="p in provinces" :class="{active:province===p}" @click="province=p;city=''">{{p}}</button></div><h3>选择城市</h3><div class="option-grid"><button v-for="c in cities" :class="{active:city===c}" @click="chooseRegion(province,c)">{{c}}</button></div></section></div></main></template>
