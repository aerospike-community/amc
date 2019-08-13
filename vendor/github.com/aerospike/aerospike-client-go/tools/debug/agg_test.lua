function statUser(s,tick,tp)

	local dus = 60*60*24*1000
	local wus = dus*7
	local mus = dus*30

	local function filter(record)
		return (record.tp == tp) and (record.ignore ~= 1)
	end

	local function addValues(statMap,record)
		statMap['au'] = (statMap['au'] or 0) + 1

		if record.mt == null then
			return statMap
		end

		if record.mt > (tick-dus) then
			statMap['dau'] = (statMap['dau'] or 0) + 1
		end

		if record.mt > (tick-wus) then
			statMap['wau'] = (statMap['wau'] or 0)+ 1
		end

		if record.mt > (tick-mus) then
			statMap['mau'] = (statMap['mau'] or 0) + 1
		end

		return statMap
	end

	local function statMerge(a,b)
        return a+b
    end

	local function reduceValues(a,b)
		return map.merge(a,b,statMerge)
	end

	return s : filter(filter) : aggregate(map(), addValues) : reduce(reduceValues)

end
