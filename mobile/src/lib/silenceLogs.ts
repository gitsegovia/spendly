// En builds de producción silenciamos log/warn: evitan filtrar datos de sesión
// y tienen costo de performance en RN. console.error se conserva para crash reporting.
if (!__DEV__) {
  console.log = () => {};
  console.warn = () => {};
}

export {};
