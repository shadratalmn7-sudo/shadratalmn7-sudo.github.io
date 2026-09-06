// تم إيقاف النوافذ المنبثقة الخاصة بالخدمات داخل الموقع.
// الخدمات تبقى ضمن قسم الخدمات، أما التنبيهات المهمة فتدار من نظام الإشعارات الداخلي/الخارجي.
if(!window.__shadratServiceAutoAlerts){
  window.__shadratServiceAutoAlerts=true;
  document.querySelectorAll('.shz-service-alert-stack,.shz-service-alert').forEach(el=>el.remove());
  window.ShadratServiceAlertTest={disabled:true,reason:'services-belong-in-services-section'};
}
