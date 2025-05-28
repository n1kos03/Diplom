#!/bin/sh

# Запускаем MinIO в фоне
minio server /data --console-address ":9001" &

# Ждем готовности MinIO
while true; do
  if [ -e /data/.minio.sys/config/config.json ]; then
    break
  fi
  sleep 1
done

# Даем дополнительное время на инициализацию
sleep 3

# Настраиваем клиент
mc alias set local http://localhost:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD}

# Основной цикл для проверки бакетов
while true; do
  echo "Проверяю бакеты..."
  mc ls local 2>/dev/null | while read line; do
    # Извлекаем имя бакета без grep/awk
    bucket=$(echo "${line}" | tr -s ' ' | cut -d' ' -f5 | tr -d '/')
    
    if [ -n "${bucket}" ]; then
      # Проверяем политику (новая версия mc)
      policy=$(mc anonymous get local/${bucket} 2>&1)
      
      # Если нет политики или ошибка доступа, устанавливаем
      if [[ "$policy" == *"none"* ]] || [[ "$policy" == *"AccessDenied"* ]] || [[ "$policy" == *"private"* ]]; then
        echo "Устанавливаю public доступ для: ${bucket}"
        mc anonymous set public local/${bucket}
      fi
    fi
  done
  sleep 5
done
